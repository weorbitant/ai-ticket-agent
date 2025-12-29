import { type Ticket, type QualityReport, type SearchResult } from "../../../domain/models/ticket.js";
import { type EstimateEffortResult } from "../../../domain/ports/input/estimate-effort.port.js";
import { type RefineTicketResult } from "../../../domain/ports/input/refine-ticket.port.js";

/**
 * Returns an icon for the ticket status.
 */
export function getStatusIcon(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("closed") || statusLower.includes("cerrada")) return "✅";
  if (statusLower.includes("progress") || statusLower.includes("progreso")) return "🔄";
  if (statusLower.includes("open") || statusLower.includes("to do") || statusLower.includes("nueva")) return "🔵";
  return "⚪";
}

/**
 * Returns an icon for the ticket type.
 */
export function getTypeIcon(type: string): string {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("bug")) return "🐛";
  if (typeLower.includes("story")) return "📖";
  if (typeLower.includes("epic")) return "🎯";
  if (typeLower.includes("task") || typeLower.includes("tarea")) return "✅";
  if (typeLower.includes("sub")) return "📎";
  return "📝";
}

/**
 * Displays a list of tickets in a formatted way.
 */
export function displayTickets(tickets: Ticket[]): void {
  if (tickets.length === 0) {
    console.log("\n📭 No se encontraron issues que coincidan con la búsqueda.");
    return;
  }

  console.log(`\n📋 Encontrados ${tickets.length} issue(s):\n`);

  for (const ticket of tickets) {
    const statusIcon = getStatusIcon(ticket.status);
    const typeIcon = getTypeIcon(ticket.type);

    console.log(`${typeIcon} ${ticket.key} ${statusIcon}`);
    console.log(`   ${ticket.summary}`);

    const metadata: string[] = [];
    if (ticket.assignee) metadata.push(`👤 ${ticket.assignee}`);
    if (ticket.priority) metadata.push(`⚡ ${ticket.priority}`);
    if (ticket.components.length > 0) metadata.push(`📦 ${ticket.components.join(", ")}`);

    if (metadata.length > 0) {
      console.log(`   ${metadata.join(" | ")}`);
    }

    console.log("");
  }
}

/**
 * Displays a search result with JQL information.
 */
export function displaySearchResult(result: SearchResult, showJql: boolean, verbose: boolean): void {
  if (showJql || verbose) {
    console.log("\n📝 JQL generado:");
    console.log(`   ${result.jql}`);
  }

  if (verbose && result.explanation.length > 0) {
    console.log(`\nBúsqueda:\n${result.explanation.map((e) => `  • ${e}`).join("\n")}`);
  }

  console.log("\n───────────────────────────────────────");
  displayTickets(result.tickets);
}

/**
 * Displays a ticket's basic info.
 */
export function displayTicketInfo(ticket: Ticket): void {
  const typeIcon = getTypeIcon(ticket.type);
  console.log(`\n${typeIcon} ${ticket.key}: ${ticket.summary}`);
  console.log(`   Tipo: ${ticket.type} | Estado: ${ticket.status}`);
}

/**
 * Displays a quality report.
 */
export function displayQualityReport(report: QualityReport, verbose: boolean): void {
  displayTicketInfo(report.ticket);

  console.log("\n📝 Criterios de calidad:\n");

  // Component
  if (report.hasComponent) {
    console.log(`   ✅ Componente: ${report.ticket.components.join(", ")}`);
  } else {
    console.log("   ❌ Componente: No asignado");
  }

  // Story Points
  if (report.hasStoryPoints) {
    console.log(`   ✅ Story Points: ${report.ticket.storyPoints}`);
  } else {
    console.log("   ❌ Story Points: No asignados");
  }

  // Description
  if (report.descriptionEvaluation.isAdequate) {
    console.log("   ✅ Descripción: Adecuada");
    if (verbose) {
      console.log(`      → ${report.descriptionEvaluation.feedback}`);
    }
  } else {
    console.log("   ❌ Descripción: Insuficiente");
    console.log(`      → ${report.descriptionEvaluation.feedback}`);
  }

  // Title
  if (report.titleEvaluation.isAdequate) {
    console.log("   ✅ Título: Claro");
    if (verbose) {
      console.log(`      → ${report.titleEvaluation.feedback}`);
    }
  } else {
    console.log("   ❌ Título: Poco claro");
    console.log(`      → ${report.titleEvaluation.feedback}`);
  }

  // Summary
  console.log("\n───────────────────────────────────────");
  if (report.passedChecks === report.totalChecks) {
    console.log(`✅ Ticket completo: ${report.passedChecks}/${report.totalChecks} criterios cumplidos`);
  } else if (report.passedChecks >= report.totalChecks / 2) {
    console.log(`⚠️  Ticket parcial: ${report.passedChecks}/${report.totalChecks} criterios cumplidos`);
  } else {
    console.log(`❌ Ticket incompleto: ${report.passedChecks}/${report.totalChecks} criterios cumplidos`);
  }
  console.log("");
}

/**
 * Displays an estimation result.
 */
export function displayEstimationResult(result: EstimateEffortResult): void {
  displayTicketInfo(result.ticket);

  console.log("\n───────────────────────────────────────");
  console.log(`\n🎲 Estimación: ${result.estimation.points} punto${result.estimation.points > 1 ? "s" : ""}`);
  console.log(`\n💡 Razonamiento:`);
  console.log(`   ${result.estimation.reasoning}`);
  console.log("");
}

/**
 * Displays a refinement result.
 */
export function displayRefinementResult(result: RefineTicketResult): void {
  displayTicketInfo(result.ticket);

  console.log("\n═══════════════════════════════════════");
  console.log("           TICKET REFINADO");
  console.log("═══════════════════════════════════════");

  const { refinement } = result;

  // Suggested title
  if (refinement.suggestedTitle) {
    console.log("\n📝 Título sugerido:");
    console.log(`   ${refinement.suggestedTitle}`);
  } else {
    console.log("\n📝 Título: (mantener el actual)");
  }

  // Context
  if (refinement.context) {
    console.log("\n📖 Contexto:");
    const contextLines = refinement.context.split("\n");
    for (const line of contextLines) {
      console.log(`   ${line}`);
    }
  }

  // Tasks
  if (refinement.tasks.length > 0) {
    console.log("\n🔧 Tareas técnicas:");
    refinement.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task}`);
    });
  }

  // Acceptance criteria
  if (refinement.acceptanceCriteria.length > 0) {
    console.log("\n✅ Criterios de aceptación:");
    refinement.acceptanceCriteria.forEach((criterion) => {
      console.log(`   • ${criterion}`);
    });
  }

  // Additional notes
  if (refinement.additionalNotes) {
    console.log("\n📌 Notas adicionales:");
    const notesLines = refinement.additionalNotes.split("\n");
    for (const line of notesLines) {
      console.log(`   ${line}`);
    }
  }

  // Warnings
  if (refinement.warnings.length > 0) {
    console.log("\n───────────────────────────────────────");
    console.log("⚠️  WARNINGS:");
    refinement.warnings.forEach((warning) => {
      console.log(`   • ${warning}`);
    });
  }

  // Summary
  console.log("\n═══════════════════════════════════════");
  if (refinement.isComplete) {
    console.log("✅ Refinamiento completo");
  } else {
    console.log("⚠️  Refinamiento parcial - revisar warnings");
  }
  console.log("");
}

