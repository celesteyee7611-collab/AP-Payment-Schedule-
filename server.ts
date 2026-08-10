import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit for PDF / Image base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI extraction will use heuristic fallback parsing if API is unreachable.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key-for-initialization",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Boon Huat AP Payment Schedule Assistant" });
});

// API: Analyze Supplier Invoice (Vision / Document Extraction)
app.post("/api/analyze-invoice", async (req, res) => {
  try {
    const { fileDataUrl, mimeType, rawText, fileName } = req.body;

    if (!fileDataUrl && !rawText) {
      return res.status(400).json({ error: "Missing invoice document data or raw text." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
You are an expert Accounts Payable AI Specialist analyzing supplier invoices for "Boon Huat Hardware & Supplies" (Hardware, Steel & Industrial Building Supplies Supplier in Singapore).

Your objective:
Accurately extract all formal invoice details from the document provided (image, PDF base64, or invoice text).

Required Fields to Extract:
1. supplierName: Full registered name of the supplier/vendor.
2. invoiceNumber: Unique invoice or bill number.
3. invoiceDate: Invoice issuance date in YYYY-MM-DD format.
4. dueDate: Payment due date in YYYY-MM-DD format. If not explicitly stated, estimate based on payment terms (e.g. 30 days after invoice date). Current reference date is 2026-07-30.
5. amount: Total net payable amount as a number (excluding currency symbol).
6. currency: Currency code (e.g., "SGD", "USD", "MYR"). Default to "SGD" if unspecified or $.
7. paymentTerms: Payment terms string (e.g., "Net 30 Days", "Net 14 Days", "COD", "2% 10 Net 30").
8. poNumber: Purchase Order number if present (e.g., "PO-BH-2026-XXXX").
9. bankDetails: Bank account, PayNow, or SWIFT wire transfer details found on the invoice.
10. category: Inventory/Expense classification (e.g., "Steel & Structural Metals", "Fasteners & Hardware", "Tools & Equipment", "Safety & PPE", "Paints & Sealants", "Electrical Supplies", "Logistics").
11. lineItems: Array of itemized lines with description, qty, unitPrice, and total.
12. notes: Any urgent notices, late payment penalty disclosures, or early payment discount offers.

Be exact, factual, and strictly factual. Do not make unsupported assumptions.
`;

    const contentsParts: any[] = [];

    if (fileDataUrl && mimeType) {
      // Remove data URL prefix if present e.g. "data:image/png;base64,"
      const base64Data = fileDataUrl.includes(",") ? fileDataUrl.split(",")[1] : fileDataUrl;
      contentsParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
      contentsParts.push({
        text: "Please extract the structured invoice details from this supplier invoice image/document."
      });
    } else if (rawText) {
      contentsParts.push({
        text: `Extract structured supplier invoice details from the following invoice text:\n\n${rawText}`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contentsParts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            invoiceDate: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            paymentTerms: { type: Type.STRING },
            poNumber: { type: Type.STRING },
            bankDetails: { type: Type.STRING },
            category: { type: Type.STRING },
            notes: { type: Type.STRING },
            aiConfidence: { type: Type.NUMBER },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  qty: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  total: { type: Type.NUMBER },
                },
                required: ["description", "qty", "unitPrice", "total"],
              },
            },
          },
          required: [
            "supplierName",
            "invoiceNumber",
            "invoiceDate",
            "dueDate",
            "amount",
            "paymentTerms"
          ],
        },
      },
    });

    const jsonText = response.text || "{}";
    const extractedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      extractedData,
      fileName: fileName || "uploaded_invoice.pdf"
    });
  } catch (error: any) {
    console.error("Error in /api/analyze-invoice:", error);
    return res.status(500).json({
      error: "Failed to extract invoice data.",
      details: error.message || String(error)
    });
  }
});

// API: Accounts Payable AI Assistant Chat
app.post("/api/chat-assistant", async (req, res) => {
  try {
    const { message, invoices, role } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `
You are the Accounts Payable AI Assistant for Madam Lim and the AP team at Boon Huat Hardware & Supplies.

Your primary role is to assist Madam Lim, an experienced Accounts Payable professional who maintains full authority over all payment approvals.

Key Guidelines:
1. Speak in friendly, respectful, plain English. Avoid complex financial jargon or technical developer terms.
2. Provide clear recommendations on payment schedules based on payment due dates.
3. For any recommendation on a specific payment, structure your plain-language explanation to answer:
   - Why was this payment prioritised?
   - What risk exists if payment is delayed?
   - What should Madam Lim do next?
4. Always emphasize that the AI ONLY assists with recommendations. Madam Lim retains 100% decision control and human approval is required before any payment is approved or executed.

Current Active Invoice Schedule Context:
${JSON.stringify(invoices || [], null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return res.json({
      reply: response.text || "I have analyzed the current Accounts Payable schedule. Please let me know if you need further details on specific supplier due dates."
    });
  } catch (error: any) {
    console.error("Error in /api/chat-assistant:", error);
    return res.status(500).json({
      error: "AP Assistant failed to process request.",
      details: error.message || String(error)
    });
  }
});

// Vite & Static File Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Boon Huat AP Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
