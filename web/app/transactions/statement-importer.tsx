"use client";

import { ChangeEvent, useRef, useState } from "react";
import { API_BASE_URL } from "../../lib/api";

export type ExtractedStatementRow = {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category?: string;
  currency: "INR";
  credit: number;
  debit: number;
};

type StatementImportPanelProps = {
  onTransactionsReady: (
    rows: ExtractedStatementRow[],
    sourceName: string,
  ) => void;
};

const normalizeDate = (value: string): string => {
  const cleaned = value.trim();
  const slashMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, first, second, yearPart] = slashMatch;
    const year = Number(yearPart.length === 2 ? `20${yearPart}` : yearPart);
    const month = Number(first);
    const day = Number(second);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      const safeDate = new Date(year, month - 1, day);
      if (!Number.isNaN(safeDate.getTime())) {
        return safeDate.toISOString().slice(0, 10);
      }
    }
  }

  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return cleaned;
  }

  return cleaned.replace(/\s+/g, " ");
};

const inferCategory = (description: string): string | undefined => {
  const text = description.toLowerCase();
  if (
    text.includes("salary") ||
    text.includes("payroll") ||
    text.includes("bonus")
  ) {
    return "Salary";
  }
  if (
    text.includes("grocery") ||
    text.includes("supermarket") ||
    text.includes("vegetable") ||
    text.includes("fruit")
  ) {
    return "Grocery";
  }
  if (
    text.includes("rent") ||
    text.includes("lease") ||
    text.includes("mortgage")
  ) {
    return "Misc Expense";
  }
  if (text.includes("insurance") || text.includes("premium")) {
    return "Health Insurance Premium";
  }
  if (
    text.includes("uber") ||
    text.includes("cab") ||
    text.includes("travel") ||
    text.includes("flight")
  ) {
    return "Misc Expense";
  }
  if (
    text.includes("electricity") ||
    text.includes("wifi") ||
    text.includes("internet") ||
    text.includes("water") ||
    text.includes("mobile")
  ) {
    return "Internet / WiFi";
  }
  if (text.includes("emi") || text.includes("loan")) {
    return "Loan EMI Paid";
  }
  return "Misc Expense";
};

const parseBankStatementText = (text: string): ExtractedStatementRow[] => {
  const rows: ExtractedStatementRow[] = [];
  const lines = text
    .split(/\r?\n|\s{2,}/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 8);

  for (const line of lines) {
    const dateMatch = line.match(
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})/,
    );
    if (!dateMatch) {
      continue;
    }

    const amountMatch = line.match(
      /(?:₹|INR|Rs\.?|rs\.?|INR\s*)?\s*([+-]?\d[\d,]*(?:\.\d{1,2})?)/i,
    );
    const directionMatch = line.match(/\b(CR|DR|CREDIT|DEBIT)\b/i);
    if (!amountMatch) {
      continue;
    }

    const rawDate = dateMatch[1];
    const rawAmount = amountMatch[1].replace(/,/g, "");
    const numericAmount = Number(rawAmount);
    if (!Number.isFinite(numericAmount)) {
      continue;
    }

    const description = line
      .replace(rawDate, "")
      .replace(amountMatch[0], "")
      .replace(/\b(CR|DR|CREDIT|DEBIT|INR|RS|₹)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!description || description.length < 3) {
      continue;
    }

    const type: "credit" | "debit" =
      directionMatch && /credit|cr/i.test(directionMatch[0])
        ? "credit"
        : numericAmount >= 0 && line.toLowerCase().includes("credit")
          ? "credit"
          : numericAmount < 0 || /debit|dr/i.test(directionMatch?.[0] ?? "")
            ? "debit"
            : "debit";

    const amountValue = Math.abs(numericAmount);
    const normalizedDate = normalizeDate(rawDate);
    const nextRow: ExtractedStatementRow = {
      date: normalizedDate,
      description: description
        .replace(/^[-:|/]+\s*/, "")
        .replace(/\s+[\|/:-]+\s*$/, ""),
      amount: amountValue,
      type,
      category: inferCategory(description),
      currency: "INR",
      credit: type === "credit" ? amountValue : 0,
      debit: type === "debit" ? amountValue : 0,
    };

    if (
      !rows.some(
        (row) =>
          row.date === nextRow.date &&
          row.description === nextRow.description &&
          row.amount === nextRow.amount,
      )
    ) {
      rows.push(nextRow);
    }
  }

  return rows;
};

const extractTransactionsFromPdf = async (
  fileBuffer: ArrayBuffer,
): Promise<ExtractedStatementRow[]> => {
  const pdfjsLib = await import("pdfjs-dist");
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) })
    .promise;

  const texts: string[] = [];
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => {
        if ("str" in item && typeof item.str === "string") {
          return item.str;
        }
        return "";
      })
      .join(" ");
    if (text.trim()) {
      texts.push(text);
    }
  }

  const combinedText = texts.join("\n");
  return parseBankStatementText(combinedText);
};

export function StatementImportPanel({
  onTransactionsReady,
}: StatementImportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [statusText, setStatusText] = useState("No statement uploaded yet.");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setStatusText("Only PDF bank statements are supported.");
      event.target.value = "";
      return;
    }

    setIsParsing(true);
    setStatusText(`Uploading and reading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/v1/transactions/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      const uploadPayload = uploadResponse.headers
        .get("content-type")
        ?.includes("application/json")
        ? await uploadResponse.json().catch(() => null)
        : null;

      if (!uploadResponse.ok) {
        const message =
          uploadPayload?.detail ??
          uploadPayload?.error?.message ??
          "The uploaded statement is not valid for secure processing.";
        throw new Error(message);
      }

      const serverRows = Array.isArray(uploadPayload?.preview)
        ? uploadPayload.preview.map((row: Record<string, unknown>) => ({
            date: String(row.date ?? ""),
            description: String(row.description ?? "Bank statement entry"),
            amount: Number(row.amount ?? 0),
            type: String(row.type ?? "debit") === "credit" ? "credit" : "debit",
            category:
              typeof row.category === "string" ? row.category : undefined,
            currency: "INR",
            credit: Number(row.credit ?? 0),
            debit: Number(row.debit ?? 0),
          }))
        : [];

      const rows =
        serverRows.length > 0
          ? serverRows
          : await extractTransactionsFromPdf(await file.arrayBuffer());

      if (rows.length === 0) {
        setStatusText(
          "No readable transactions were found in this statement. Please try another PDF or enter transactions manually.",
        );
        return;
      }

      setStatusText(
        `Extracted ${rows.length} transaction records from ${file.name}.`,
      );
      onTransactionsReady(rows, file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to parse the uploaded statement.";
      setStatusText(message);
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <button
        type="button"
        className="primary-btn"
        onClick={() => inputRef.current?.click()}
        disabled={isParsing}
      >
        {isParsing ? "Reading statement…" : "Click to Upload Statement"}
      </button>

      <p style={{ margin: 0, color: "#475467", minHeight: "24px" }}>
        {statusText}
      </p>
    </div>
  );
}
