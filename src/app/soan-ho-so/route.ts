import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===== TYPE DEFINITIONS =====
interface TableColumn {
  key: string;
  label: string;
}

interface TableRow {
  [key: string]: any;
}

interface TableJson {
  columns: TableColumn[];
  rows: TableRow[];
}

// ===== DEBUG GET (TEST FRONTEND) =====
export async function GET() {
  console.log("🟢 [GET] /api/export-word HIT at", new Date().toISOString());

  return NextResponse.json({
    ok: true,
    message: "API export-word is reachable",
    time: new Date().toISOString(),
  });
}

// ===== API POST =====
export async function POST(req: Request) {
  try {
    console.log("🟢========== EXPORT WORD START ==========");
    console.log("TIME:", new Date().toISOString());
    console.log("METHOD:", req.method);

    // Log headers để check frontend
    const headersObj = Object.fromEntries(req.headers.entries());
    console.log("HEADERS:", headersObj);

    const body = await req.json();
    console.log("REQ BODY:", body);

    const { id } = body;

    if (!id) {
      console.error("❌ BODY KHÔNG CÓ ID");
      return NextResponse.json(
        { error: "Missing id in request body", __debug: true },
        { status: 400 }
      );
    }

    const projectData = await (prisma as any).duLieuDuAn.findUnique({
      where: { id },
    });

    console.log("PROJECT DATA FOUND:", !!projectData);

    if (!projectData) {
      console.error("❌ Không tìm thấy project với id:", id);
      return NextResponse.json(
        { error: "Không tìm thấy", __debug: true },
        { status: 404 }
      );
    }

    // ===== PARSE JSON BẢNG =====
    let raw: TableJson = { columns: [], rows: [] };

    try {
      raw =
        typeof projectData.bang_dong === "string"
          ? JSON.parse(projectData.bang_dong)
          : projectData.bang_dong || raw;
    } catch (e) {
      console.error("❌ Lỗi parse bang_dong", e);
    }

    console.log("RAW TABLE JSON:", JSON.stringify(raw, null, 2));

    const columns: TableColumn[] = raw.columns || [];
    const rows: TableRow[] = raw.rows || [];

    console.log("COLUMNS LENGTH:", columns.length);
    console.log("ROWS LENGTH:", rows.length);

    // ===== BUILD TEMPLATE DATA =====
    const tableData: Record<string, string> = {};

    const MAX_COL = 6;
    const MAX_ROW = 3;

    // Header
    for (let c = 1; c <= MAX_COL; c++) {
      tableData[`h${c}`] = columns[c - 1]?.label ?? "";
      console.log(`HEADER h${c}:`, tableData[`h${c}`]);
    }

    // Rows
    for (let r = 1; r <= MAX_ROW; r++) {
      const row = rows[r - 1];
      console.log(`ROW ${r} EXISTS:`, !!row);

      for (let c = 1; c <= MAX_COL; c++) {
        const col = columns[c - 1];
        let value = "";

        if (row && col?.key) {
          value = row[col.key] ?? "";
        }

        tableData[`r${r}c${c}`] = String(value);
        console.log(`CELL r${r}c${c}:`, value);
      }
    }

    const finalData = {
      ...projectData,
      ...tableData,
    };

    console.log(
      "FINAL DATA KEYS:",
      Object.keys(finalData).filter(k => k.startsWith("h") || k.startsWith("r"))
    );

    console.log("🟢========== EXPORT WORD END ==========");

    return NextResponse.json({
      success: true,
      data: finalData,
      __debug: {
        api: "export-word",
        time: new Date().toISOString(),
        hasId: true,
      },
    });

  } catch (error: any) {
    console.error("❌ EXPORT ERROR:", error);
    return NextResponse.json(
      { error: error.message, __debug: true },
      { status: 500 }
    );
  }
}
