import type { VercelRequest, VercelResponse } from "@vercel/node";

import { lex } from "../src/lexer/Lexer.js";
import { parse } from "../src/parser/Parser.js";
import { obfuscate } from "../src/obfuscator/Obfuscator.js";
import { encodeStrings } from "../src/obfuscator/StringEncoder.js";
import { scrambleControlFlow } from "../src/obfuscator/ControlFlowScrambler.js";
import { printChunk, printChunkOneLine } from "../src/obfuscator/Printer.js";
import { compile } from "../src/vm/Compiler.js";
import { regCompile } from "../src/vm/RegCompiler.js";
import { generateVM } from "../src/vm/vm-gen.js";
import { generateRegVM } from "../src/vm/reg-vm-gen.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  try {
    const { code, options } = req.body ?? {};

    if (typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Invalid 'code' parameter"
      });
    }

    const opts = options ?? {};

    const noRename = opts.noRename === true;
    const noPreserve = opts.noPreserve === true;
    const encodeStringsOpt = opts.encodeStrings === true;
    const scrambleOpt = opts.scramble === true;
    const oneLineOpt = opts.oneLine === true;

    const vmType = opts.vmType || "none";
    const vmLevel = opts.vmLevel || "normal";

    // Lexer
    const { tokens, errors: lexErrors } = lex(code);

    if (lexErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Lexer error",
        details: lexErrors
      });
    }

    // Parser
    let ast = parse(tokens);

    // String encoding
    if (encodeStringsOpt) {
      ast = encodeStrings(ast, {
        enabled: true
      });
    }

    // Control-flow scrambling
    if (scrambleOpt) {
      ast = scrambleControlFlow(ast, {
        enabled: true
      });
    }

    let output: string;

    // =========================
    // STACK VM
    // =========================
    if (vmType === "stack") {
      const obfuscated = obfuscate(ast, {
        renameLocals: !noRename,
        preserveGlobals: !noPreserve
      });

      const chunk = compile(obfuscated);

      output = generateVM(chunk, {
        level: vmLevel as any,
        executorGlobals: vmLevel !== "debug"
      });

    // =========================
    // REGISTER VM
    // =========================
    } else if (vmType === "register") {
      const obfuscated = obfuscate(ast, {
        renameLocals: !noRename,
        preserveGlobals: !noPreserve
      });

      const chunk = regCompile(obfuscated);

      const disableFeatures: string[] = [];

      if (vmLevel === "debug") {
        disableFeatures.push("controlFlowFlattening");
      }

      output = generateRegVM(chunk, {
        level: vmLevel as any,
        executorGlobals: vmLevel !== "debug",
        polymorphicSeed: Date.now(),
        disableFeatures: disableFeatures as any[]
      });

    // =========================
    // NORMAL OBFUSCATION
    // =========================
    } else {
      const obfuscated = obfuscate(ast, {
        renameLocals: !noRename,
        preserveGlobals: !noPreserve
      });

      output = oneLineOpt
        ? printChunkOneLine(obfuscated)
        : printChunk(obfuscated);
    }

    return res.status(200).json({
      success: true,
      output
    });

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err);

    console.error("Obfuscation error:", err);

    return res.status(500).json({
      success: false,
      error: message
    });
  }
}
