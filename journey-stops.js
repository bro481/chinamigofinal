(() => {
  const baseDefaultDay = defaultItineraryDay;
  defaultItineraryDay = function (index = 0) { return { ...baseDefaultDay(index), intro: "", stops: [] }; };

  function stopImageHtml(src, index) {
    return `<span draggable="true" data-stop-image-index="${index}" title="拖动调整顺序，点击预览"><img src="${escapeHtml(src)}" alt=""><button type="button" data-remove-stop-image="${index}" aria-label="删除图片" title="删除图片">×</button>${index === 0 ? '<small>首图</small>' : ''}</span>`;
  }

  function stopHtml(stop = {}, index = 0) {
    const images = Array.isArray(stop.images) ? stop.images.slice(0, 5) : [];
    return `<section class="journey-stop-block" data-journey-stop-block data-stop-id="${escapeHtml(stop.id || `stop-${Date.now()}-${index}`)}" data-stop-images="${escapeHtml(listToCsv(images))}" contenteditable="false">
      <div class="journey-stop-rail"><button class="journey-stop-handle" type="button" draggable="true" title="拖动排序">⋮⋮</button><i></i></div>
      <label class="journey-stop-field journey-stop-time-field ${stop.time ? 'has-time' : ''}"><span>时间 <em>可选</em></span><button type="button" data-add-stop-time>＋ 添加时间</button><input data-stop-field="time" type="time" value="${escapeHtml(stop.time || "")}"><small class="journey-stop-time-warning" data-stop-time-warning hidden>时间早于上一节点，仍可按当前顺序保存</small></label>
      <div class="journey-stop-main"><label class="journey-stop-field"><span>标题</span><input class="journey-stop-title" data-stop-field="title" value="${escapeHtml(stop.title || "")}" placeholder="输入节点标题"></label><label class="journey-stop-field journey-stop-description-field"><span>描述 <em>富文本</em></span><div class="journey-stop-inline-toolbar"><button type="button" data-stop-inline-format="bold"><b>B</b></button><button type="button" data-stop-inline-format="italic"><i>I</i></button><button type="button" data-stop-inline-format="underline"><u>U</u></button><button type="button" data-stop-inline-format="createLink">⌁</button><button type="button" data-stop-inline-format="insertUnorderedList">•☰</button><button type="button" data-stop-inline-format="insertOrderedList">1☰</button></div><div class="journey-stop-description" data-stop-field="description" contenteditable="true" data-placeholder="输入节点描述…">${stop.description || ""}</div></label></div>
      <div class="journey-stop-media-wrap"><div class="journey-stop-media-head"><span>图片</span><em>${images.length} / 5</em></div><div class="journey-stop-media">${images.map(stopImageHtml).join("")}<button class="journey-stop-add-image" type="button" data-add-stop-image ${images.length >= 5 ? "disabled" : ""}><b>＋</b><small>${images.length >= 5 ? '已达上限' : '添加图片'}</small></button></div></div>
      <button class="journey-stop-remove" type="button" data-remove-journey-stop aria-label="删除节点" title="删除节点">×</button>
      <button class="journey-stop-between-add" type="button" data-add-after-stop><span>＋</span> 添加行程节点</button>
    </section>`;
  }
  function flattenNestedStops(editor) { $$('[data-journey-stop-block] [data-journey-stop-block]', editor).forEach(nested => { const outer=nested.parentElement?.closest('[data-journey-stop-block]'); if(outer) outer.after(nested); else editor.append(nested); }); }
  function topLevelStops(editor) { return [...editor.children].filter(node => node.matches?.('[data-journey-stop-block]')); }
  function updateStopTimeWarnings(editor = $('[data-journey-visual-editor]')) {
    if (!editor) return;
    const blocks = topLevelStops(editor);
    blocks.forEach((block, index) => {
      const warning = block.querySelector('[data-stop-time-warning]');
      const current = block.querySelector('[data-stop-field="time"]')?.value || '';
      const previous = index > 0 ? blocks[index - 1].querySelector('[data-stop-field="time"]')?.value || '' : '';
      const reversed = Boolean(current && previous && current < previous);
      block.classList.toggle('has-time-warning', reversed);
      if (warning) warning.hidden = !reversed;
    });
  }
  function stopData(editor) { flattenNestedStops(editor); return topLevelStops(editor).map((block, i) => ({ id: block.dataset.stopId || `stop-${Date.now()}-${i}`, time: block.querySelector(':scope > [data-stop-field="time"], :scope > .journey-stop-time-field [data-stop-field="time"]')?.value || "", title: block.querySelector(':scope > .journey-stop-main [data-stop-field="title"]')?.value.trim() || "", description: block.querySelector(':scope > .journey-stop-main [data-stop-field="description"]')?.innerHTML.trim() || "", images: csvToList(block.dataset.stopImages || "").slice(0,5) })); }
  function bodyWithMarkers(editor) { const clone = editor.cloneNode(true); flattenNestedStops(clone); [...clone.children].filter(node => node.matches?.('[data-journey-stop-block]')).forEach(block => { const marker = document.createElement('p'); marker.dataset.stopMarker = block.dataset.stopId; block.replaceWith(marker); }); return clone.innerHTML.trim(); }
  function bodyWithStops(body, stops) { let html = editableDayHtml(body); (stops || []).forEach((stop, i) => { const marker = `<p data-stop-marker="${escapeHtml(stop.id)}"></p>`; html = html.includes(marker) ? html.replace(marker, stopHtml(stop, i)) : html + stopHtml(stop, i); }); return html; }

  const baseReadDays = readItineraryDays;
  readItineraryDays = function () { const days = baseReadDays(); const editor = $('[data-journey-visual-editor]'); const index = state.currentExperienceDay; if (editor && days[index]) { days[index].intro = $('[data-day-field="intro"]')?.value || ""; days[index].body = bodyWithMarkers(editor); days[index].stops = stopData(editor); } return days; };

  const baseToolbar = renderDayToolbar;
  renderDayToolbar = function (active, options = {}) { baseToolbar(active, options); if ((options.mediaLang || 'journey') !== 'journey') return; const group = $('[data-day-toolbar] .editor-tool-group'); if (group && !group.querySelector('[data-open-journey-stop]')) group.insertAdjacentHTML('beforeend', '<button class="secondary journey-stop-insert-button" type="button" data-open-journey-stop>+ 行程节点</button>'); };

  renderDayEditor = function () {
    const days = readItineraryDays(); $('[name="itineraryDays"]').value = JSON.stringify(days); if (state.currentExperienceDay >= days.length) state.currentExperienceDay = 0; renderDayListTitles(days);
    const day = normalizeItineraryDay(days[state.currentExperienceDay] || {}, state.currentExperienceDay); const title = cleanDayTitle(day.title || '', state.currentExperienceDay); const body = dayCanvasText(day); renderDayToolbar(inferDayTemplate(day));
    $('[data-day-fields]').innerHTML = `<div class="day-basics-row"><label>当天标题<input data-day-field="title" value="${escapeHtml(title)}" placeholder="Arrival & Slow Evening"></label><label>一句话介绍<input data-day-field="intro" value="${escapeHtml(day.intro || '')}" placeholder="A relaxed first day to settle in..."></label></div><textarea data-day-field="summary" hidden>${escapeHtml(day.summary || '')}</textarea><div class="document-editor journey-document-editor ${body.trim() ? '' : 'is-empty-editor'}"><div class="visual-editor journey-visual-editor" data-empty-hint="开始输入内容，或插入行程节点…" data-visual-editor="journey" data-day-field="body" data-journey-visual-editor contenteditable="true">${bodyWithStops(body, day.stops || [])}</div></div><div class="journey-stop-quick-add"><button type="button" data-open-journey-stop>＋ 行程节点</button><small>在当前 Day 的正文末尾快速插入结构化节点</small></div><input data-day-field="image" type="hidden" value="${escapeHtml(day.image || '')}">`;
    updateStopTimeWarnings();
    updateDayWordCount(); resetJourneyEditorHistory(); renderItineraryPreview(days);
  };

  let savedJourneyRange = null;
  function rememberJourneyRange() {
    const editor = $('[data-journey-visual-editor]');
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedJourneyRange = range.cloneRange();
  }

  function insertEmptyStopAtCaret() {
    const editor = $('[data-journey-visual-editor]');
    if (!editor) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = stopHtml({ id: `stop-${Date.now().toString(36)}`, time: '', title: '', description: '', images: [] });
    const block = wrapper.firstElementChild;
    const continuation = document.createElement('p');
    continuation.innerHTML = '<br>';
    flattenNestedStops(editor);
    const rangeContainer = savedJourneyRange?.commonAncestorContainer?.nodeType === Node.ELEMENT_NODE ? savedJourneyRange.commonAncestorContainer : savedJourneyRange?.commonAncestorContainer?.parentElement;
    const currentStop = rangeContainer?.closest?.('[data-journey-stop-block]');
    if (currentStop && editor.contains(currentStop)) {
      currentStop.after(block, continuation);
    } else if (savedJourneyRange && editor.contains(savedJourneyRange.commonAncestorContainer)) {
      const range = savedJourneyRange.cloneRange();
      range.collapse(false);
      range.insertNode(continuation);
      range.insertNode(block);
    } else {
      editor.append(block, continuation);
    }
    savedJourneyRange = null;
    flattenNestedStops(editor);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    const title = block.querySelector('[data-stop-field="title"]');
    title?.focus({ preventScroll: true });
    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function insertStopAfter(currentStop) {
    const editor = $('[data-journey-visual-editor]');
    if (!editor || !currentStop) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = stopHtml({ id: `stop-${Date.now().toString(36)}`, time: '', title: '', description: '', images: [] });
    const block = wrapper.firstElementChild;
    const continuation = document.createElement('p');
    continuation.innerHTML = '<br>';
    currentStop.insertAdjacentElement('afterend', block);
    block.insertAdjacentElement('afterend', continuation);
    savedJourneyRange = null;
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    block.querySelector('[data-stop-field="title"]')?.focus({ preventScroll: true });
    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('已在下方添加行程节点');
  }

  function renderStopMedia(block) {
    if (!block) return;
    const images = csvToList(block.dataset.stopImages || '').slice(0, 5);
    block.dataset.stopImages = listToCsv(images);
    const count = block.querySelector('.journey-stop-media-head em');
    const media = block.querySelector('.journey-stop-media');
    if (count) count.textContent = `${images.length} / 5`;
    if (!media) return;
    media.innerHTML = `${images.map(stopImageHtml).join('')}<button class="journey-stop-add-image" type="button" data-add-stop-image ${images.length >= 5 ? 'disabled' : ''}><b>＋</b><small>${images.length >= 5 ? '已达上限' : '添加图片'}</small></button>`;
  }

  function addPickedImageToStop(url) {
    const target = state.mediaPicker?.target || '';
    if (!target.startsWith('journey-stop:') || !url) return false;
    const stopId = target.slice('journey-stop:'.length);
    const block = [...document.querySelectorAll('[data-journey-stop-block]')].find(item => item.dataset.stopId === stopId);
    if (!block) return false;
    const images = csvToList(block.dataset.stopImages || '').slice(0, 5);
    if (!images.includes(url) && images.length < 5) images.push(url);
    block.dataset.stopImages = listToCsv(images);
    renderStopMedia(block);
    $('[data-journey-visual-editor]')?.dispatchEvent(new Event('input', { bubbles: true }));
    $('[data-experience-save-status]') && ($('[data-experience-save-status]').textContent = '未保存');
    closeMediaPicker();
    showToast('图片已添加到当前行程节点');
    return true;
  }

  document.addEventListener('selectionchange', rememberJourneyRange);
  document.addEventListener('mouseup', event => { if (event.target.closest?.('[data-journey-visual-editor]')) rememberJourneyRange(); });
  document.addEventListener('keyup', event => { if (event.target.closest?.('[data-journey-visual-editor]')) rememberJourneyRange(); });

  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-open-journey-stop]')) { event.preventDefault(); event.stopImmediatePropagation(); insertEmptyStopAtCaret(); }
    if (button.matches('[data-add-stop-time]')) { event.preventDefault(); event.stopImmediatePropagation(); const field=button.closest('.journey-stop-time-field'); field?.classList.add('has-time'); field?.querySelector('input')?.showPicker?.(); field?.querySelector('input')?.focus(); }
    if (button.matches('[data-add-after-stop]')) { event.preventDefault(); event.stopImmediatePropagation(); insertStopAfter(button.closest('[data-journey-stop-block]')); }
    if (button.matches('[data-remove-journey-stop]')) { button.closest('[data-journey-stop-block]')?.remove(); updateStopTimeWarnings(); $('[data-journey-visual-editor]')?.dispatchEvent(new Event('input',{bubbles:true})); }
    if (button.matches('[data-add-stop-image]')) { event.preventDefault(); event.stopImmediatePropagation(); const block=button.closest('[data-journey-stop-block]'); openMediaPicker(`journey-stop:${block.dataset.stopId}`,{category:'trips',title:'选择节点图片（最多 5 张）'}); }
    if (button.matches('[data-pick-media]') && state.mediaPicker?.target?.startsWith('journey-stop:')) { event.preventDefault(); event.stopImmediatePropagation(); addPickedImageToStop(button.dataset.pickMedia); }
    if (button.matches('[data-remove-stop-image]')) { event.preventDefault(); event.stopImmediatePropagation(); const block=button.closest('[data-journey-stop-block]'); const images=csvToList(block.dataset.stopImages||''); images.splice(Number(button.dataset.removeStopImage),1); block.dataset.stopImages=listToCsv(images); renderStopMedia(block); $('[data-journey-visual-editor]')?.dispatchEvent(new Event('input',{bubbles:true})); }
    if (button.matches('[data-stop-inline-format]')) { event.preventDefault(); event.stopImmediatePropagation(); const editor=button.closest('.journey-stop-description-field')?.querySelector('[data-stop-field="description"]'); editor?.focus(); let value=null; if(button.dataset.stopInlineFormat==='createLink') value=window.prompt('输入链接地址','https://')||null; if(value!==null||button.dataset.stopInlineFormat!=='createLink') document.execCommand(button.dataset.stopInlineFormat,false,value); }
  }, true);

  document.addEventListener('change', event => {
    if (!event.target.matches?.('[data-stop-field="time"]')) return;
    event.target.closest('.journey-stop-time-field')?.classList.toggle('has-time', Boolean(event.target.value));
    updateStopTimeWarnings();
  });

  let draggedStop = null;
  document.addEventListener('dragstart', event => { const handle = event.target.closest('.journey-stop-handle'); if (!handle) return; draggedStop = handle.closest('[data-journey-stop-block]'); draggedStop?.classList.add('is-dragging'); });
  document.addEventListener('dragover', event => { const block = event.target.closest('[data-journey-stop-block]'); if (!block || !draggedStop || block === draggedStop) return; event.preventDefault(); const rect = block.getBoundingClientRect(); block.parentNode.insertBefore(draggedStop, event.clientY < rect.top + rect.height/2 ? block : block.nextSibling); });
  document.addEventListener('dragend', () => { draggedStop?.classList.remove('is-dragging'); draggedStop = null; updateStopTimeWarnings(); $('[data-journey-visual-editor]')?.dispatchEvent(new Event('input',{bubbles:true})); });

  let draggedStopImage = null;
  document.addEventListener('dragstart', event => {
    const item = event.target.closest?.('[data-stop-image-index]');
    if (!item || event.target.closest('.journey-stop-handle')) return;
    draggedStopImage = item;
    item.classList.add('is-dragging');
    event.stopPropagation();
  });
  document.addEventListener('dragover', event => {
    const target = event.target.closest?.('[data-stop-image-index]');
    if (!draggedStopImage || !target || target === draggedStopImage || target.parentElement !== draggedStopImage.parentElement) return;
    event.preventDefault();
    const rect = target.getBoundingClientRect();
    target.parentElement.insertBefore(draggedStopImage, event.clientX < rect.left + rect.width / 2 ? target : target.nextSibling);
  });
  document.addEventListener('dragend', event => {
    if (!draggedStopImage) return;
    const block = draggedStopImage.closest('[data-journey-stop-block]');
    const images = [...block.querySelectorAll('[data-stop-image-index] img')].map(image => image.getAttribute('src')).filter(Boolean).slice(0, 5);
    draggedStopImage.classList.remove('is-dragging');
    draggedStopImage = null;
    block.dataset.stopImages = listToCsv(images);
    renderStopMedia(block);
    $('[data-journey-visual-editor]')?.dispatchEvent(new Event('input',{bubbles:true}));
    event.stopPropagation();
  });

  document.addEventListener('click', event => {
    const image = event.target.closest?.('[data-stop-image-index] img');
    if (!image) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const preview = document.createElement('div');
    preview.className = 'journey-stop-image-preview';
    preview.innerHTML = `<button type="button" aria-label="关闭预览">×</button><img src="${escapeHtml(image.getAttribute('src') || '')}" alt="行程节点图片预览">`;
    preview.addEventListener('click', () => preview.remove());
    document.body.append(preview);
  }, true);

  document.addEventListener('click', event => {
    const remove = event.target.closest('.journey-visual-editor figure > button, .journey-visual-editor [data-editor-media] > button');
    if (!remove || remove.matches('[data-editor-media-action]')) return;
    const figure = remove.closest('figure, [data-editor-media]');
    if (!figure) return;
    event.preventDefault(); event.stopImmediatePropagation();
    figure.remove();
    $('[data-journey-visual-editor]')?.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);
})();
