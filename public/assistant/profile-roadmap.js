// ============================================================================
// "خطتي التنفيذية" (My Action Plan) — يقرأ خارطة الطريق حسب قطاع state.sector
// من /api/assistant/roadmap (تختلف فعلياً حسب القطاع، راجع server/assistantData.js)
// ويخزّن حالة الإنجاز في state.assistant.roadmapDone عبر نفس آلية saveState()
// الموجودة أصلاً — لا تخزين جديد على السيرفر.
// ============================================================================

AiViews.roadmap = async function (container) {
  if (!state.sector) {
    container.innerHTML = `
      <h2 class="ai-view-title">🗺️ ${ta("navRoadmap")}</h2>
      <div class="ai-empty">${LANG === "ar" ? "أكمل بيانات مشروعك أولاً (القطاع تحديداً) حتى نبني لك خطة مناسبة." : "Finish your business profile first (the sector especially) so we can build the right plan for you."}</div>
      <button class="ai-btn primary" onclick="switchAiView('start')">${ta("navStart")}</button>
    `;
    return;
  }

  container.innerHTML = `<h2 class="ai-view-title">🗺️ ${ta("navRoadmap")}</h2><div class="ai-loading"><span class="dot"></span>${ta("loading")}</div>`;

  try {
    const rm = await AssistantAPI.getRoadmap(state.sector);
    ensureAssistantState();
    const done = state.assistant.roadmapDone;

    container.innerHTML = `<h2 class="ai-view-title">🗺️ ${ta("navRoadmap")}</h2>` +
      rm.phases.map((phase) => `
        <div class="ai-phase">
          <div class="ai-phase-title">${LANG === "ar" ? phase.titleAr : phase.titleEn}</div>
          ${phase.tasks.map((task) => `
            <div class="ai-task-row${done[task.id] ? " done" : ""}" data-task="${task.id}">
              <div class="box" onclick="toggleRoadmapTask('${task.id}')">${done[task.id] ? "✓" : ""}</div>
              <div class="txt" style="flex:1;">${LANG === "ar" ? task.ar : task.en}</div>
              <span class="ai-level-tag ${task.level}">${levelLabel(task.level)}</span>
            </div>
          `).join("")}
        </div>
      `).join("");
  } catch (e) {
    container.innerHTML = `<h2 class="ai-view-title">🗺️ ${ta("navRoadmap")}</h2><div class="ai-error">${ta("errorGeneric")}</div>`;
  }
};

function levelLabel(level) {
  if (LANG === "ar") return level === "required" ? "مطلوب" : level === "recommended" ? "مقترح" : "اختياري";
  return level === "required" ? "Required" : level === "recommended" ? "Recommended" : "Optional";
}

function toggleRoadmapTask(taskId) {
  ensureAssistantState();
  const done = state.assistant.roadmapDone;
  done[taskId] = !done[taskId];
  if (typeof saveState === "function") saveState();
  const row = document.querySelector(`.ai-task-row[data-task="${taskId}"]`);
  if (row) {
    row.classList.toggle("done", !!done[taskId]);
    row.querySelector(".box").textContent = done[taskId] ? "✓" : "";
  }
}
