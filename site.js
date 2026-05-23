(function () {
  const zhMap = {
    "China Guides": "中国指南",
    "Trips & Services": "行程与服务",
    "About": "关于我们",
    "Contact": "联系",
    "WhatsApp": "WhatsApp",
    "Chat on WhatsApp": "WhatsApp 咨询",
    "Explore Trips": "查看行程",
    "China Made": "让中国之旅",
    "Easy.": "更轻松。",
    "China MadeEasy.": "让中国之旅更轻松。",
    "Luxury travel and local support in China.": "面向国际访客的中国私人旅行与本地支持。",
    "Discover Modern China": "发现现代中国",
    "Modern China, Reimagined.": "重新理解现代中国。",
    "Practical guides, city ideas and private concierge support for international visitors.": "面向国际访客的实用指南、城市灵感与私人礼宾支持。",
    "Featured Experiences": "精选体验",
    "Short Experiences": "短途体验",
    "Recommended Journeys": "推荐行程",
    "Start with a city. We shape the rest around your pace.": "从一座城市开始，我们围绕你的节奏安排其余部分。",
    "Before you send the first message.": "发送第一条消息前。",
    "How quickly do you usually reply?": "通常多久回复？",
    "Most first messages receive a reply within one business day.": "大多数首次消息会在一个工作日内回复。",
    "Can we write in English?": "可以用英文沟通吗？",
    "Yes. We support English and Chinese communication before and during the journey.": "可以。行前和旅途中都支持英文与中文沟通。",
    "Do you create custom plans?": "可以定制行程吗？",
    "Yes. Share your dates, cities and travel style, and we will suggest the simplest next step.": "可以。告诉我们日期、城市和旅行风格，我们会建议最简单的下一步。",
    "Which cities do you cover?": "你们覆盖哪些城市？",
    "We support major China arrival cities and can discuss multi-city journeys case by case.": "我们支持中国主要入境城市，多城市行程可按具体情况沟通。",
    "Tell us where you are going. We will help shape the rest.": "告诉我们你要去哪里，其余部分我们来协助安排。",
    "Most journeys begin with a simple conversation. Send your dates, cities, travel style and the kind of support you may need.": "大多数行程都从一次简单沟通开始。告诉我们日期、城市、旅行风格和你可能需要的支持。",
    "Send a first message": "发送第一条消息",
    "Email": "邮箱",
    "Planning your China journey?": "正在计划你的中国之旅？",
    "Quiet concierge planning for international visitors.": "面向国际访客的安静私人行程协助。",
    "Private China Concierge": "中国私人礼宾服务",
    "Modern China moves fast. Your journey does not have to feel stressful.": "现代中国节奏很快，但你的旅程不必紧张。",
    "Airport pickup": "机场接送",
    "After a long flight, someone is already waiting for you.": "长途飞行后，已经有人在等你。",
    "High-speed rail support": "高铁协助",
    "Know where to go when the station feels too fast.": "车站节奏太快时，你也知道下一步该往哪里走。",
    "Translation help": "翻译协助",
    "Local support keeps difficult conversations moving.": "遇到沟通困难时，本地支持能让事情继续推进。",
    "Flexible timing": "灵活时间安排",
    "Plans change. Your journey adjusts quietly with them.": "计划会变化，行程也会安静地随之调整。",
    "Hotel coordination": "酒店协调",
    "Check-ins and local timing are arranged before arrival.": "入住、交通和本地时间安排会在抵达前协调好。",
    "Private transport": "私人交通",
    "Move across the city without figuring it out yourself.": "无需自己摸索，也能舒适地穿行城市。",
    "How we work": "我们的工作方式",
    "Private support, arranged before you arrive.": "私人支持，在你抵达前安排好。",
    "Traveling through China can feel unfamiliar at first.": "刚开始在中国旅行，可能会感到陌生。",
    "Airport arrivals, high-speed rail stations, payment setup, local timing and communication can quickly become stressful without support.": "机场抵达、高铁站、支付设置、本地时间和沟通，如果没有支持，很快就会变得紧张。",
    "We help coordinate those moments before you arrive, so the journey feels calmer once you are here.": "我们会在你抵达前协调这些环节，让你到达后更从容。",
    "Plan around your pace": "围绕你的节奏规划",
    "Cities, timing, hotel level, travel style and support expectations.": "城市、时间、酒店等级、旅行风格和支持需求。",
    "Coordinate the important moments": "协调重要时刻",
    "Airport pickup, station transfers, transport timing, reservations and local communication.": "机场接送、车站换乘、交通时间、预订和本地沟通。",
    "Adjust as the journey changes": "随着旅程变化调整",
    "Delayed trains, changing timing or unexpected moments are handled quietly along the way.": "列车延误、时间变化或意外情况，会在旅途中安静处理。",
    "Why we started": "为什么开始",
    "China can feel unfamiliar at first. We help you move through it more comfortably.": "中国一开始可能让人陌生。我们帮助你更舒适地进入其中。",
    "We have seen how quickly small moments can become stressful for international visitors.": "我们见过很多小瞬间如何迅速让国际访客感到紧张。",
    "Small moments": "小小的旅途瞬间",
    "Some visitors remembered the cities. Others remembered how calm the journey felt.": "有些访客记住了城市，有些则记住了旅程的从容感。",
    "Choose where your China journey begins.": "选择你的中国旅程从哪里开始。",
    "Need a custom route?": "需要定制路线？",
    "Tell us your travel rhythm, pace and preferred cities. We’ll shape a quieter China journey around you.": "告诉我们你的旅行节奏、步调和偏好的城市。我们会围绕你安排更安静的中国旅程。",
    "Send Inquiry": "发送咨询",
    "Sending...": "发送中...",
    "Inquiry received": "已收到咨询",
    "Continue on WhatsApp": "继续 WhatsApp 沟通",
    "Plan This Journey": "规划此行程",
    "Itinerary": "行程安排",
    "Included support": "包含支持",
    "Quiet support throughout the journey": "贯穿旅程的安静支持",
    "Login": "登录",
    "Log in": "登录",
    "Account": "账户",
    "Logout": "退出",
    "Language": "语言"
  };

  const skipTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT"]);
  const memoryStore = {};
  const storage = {
    get(key) {
      try {
        return window.localStorage?.getItem(key) || memoryStore[key] || "";
      } catch {
        return memoryStore[key] || "";
      }
    },
    set(key, value) {
      memoryStore[key] = value;
      try {
        window.localStorage?.setItem(key, value);
      } catch {}
    }
  };
  let currentLang = storage.get("cm_lang") || "en";
  let currentUser = null;
  let observer = null;

  function compact(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function translateTextNode(node) {
    if (!node.nodeValue || !compact(node.nodeValue)) return;
    if (!node.__cmOriginalText) node.__cmOriginalText = node.nodeValue;
    const original = compact(node.__cmOriginalText);
    if (currentLang === "zh" && zhMap[original]) {
      const leading = node.__cmOriginalText.match(/^\s*/)?.[0] || "";
      const trailing = node.__cmOriginalText.match(/\s*$/)?.[0] || "";
      node.nodeValue = `${leading}${zhMap[original]}${trailing}`;
    } else {
      node.nodeValue = node.__cmOriginalText;
    }
  }

  function translateAttributes(element) {
    ["placeholder", "aria-label", "title", "alt"].forEach((attr) => {
      if (!element.hasAttribute?.(attr)) return;
      const dataName = `data-cm-original-${attr.replace(/[^a-z0-9]+/gi, "-")}`;
      if (!element.hasAttribute(dataName)) element.setAttribute(dataName, element.getAttribute(attr));
      const stored = element.getAttribute(dataName);
      const original = compact(stored);
      element.setAttribute(attr, currentLang === "zh" && zhMap[original] ? zhMap[original] : stored);
    });
  }

  function translateRoot(root = document.body) {
    if (!root) return;
    observer?.disconnect();
    const nodes = [];
    function collect(node) {
      if (!node || skipTags.has(node.tagName)) return;
      if (node.nodeType === 1 && node.matches?.("[data-no-translate], [data-no-translate] *")) return;
      if (node.nodeType === 3 && node.parentElement && !skipTags.has(node.parentElement.tagName)) {
        nodes.push(node);
        return;
      }
      node.childNodes?.forEach(collect);
    }
    collect(root);
    nodes.forEach(translateTextNode);
    updateLangButton();
    try {
      root.querySelectorAll?.("[placeholder], [aria-label], [title], img[alt]").forEach(translateAttributes);
    } catch {}
    setTimeout(updateLangButton, 0);
    startObserver();
  }

  function updateLangButton() {
    const button = document.querySelector("[data-lang-toggle]");
    if (button) button.textContent = currentLang === "zh" ? "EN" : "中文";
    document.documentElement.setAttribute("lang", currentLang === "zh" ? "zh-CN" : "en");
    updateAccountButtons();
  }

  function updateAccountButtons() {
    document.querySelectorAll("[data-account-toggle]").forEach((button) => {
      if (currentUser) button.textContent = currentLang === "zh" ? "账户" : "Account";
      else button.textContent = currentLang === "zh" ? "登录" : "Log in";
    });
  }

  function startObserver() {
    observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length)) translateRoot(document.body);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function addHeaderControls() {
    document.querySelectorAll(".nav-links").forEach((nav) => {
      if (nav.querySelector("[data-lang-toggle]")) return;
      const langButton = document.createElement("button");
      langButton.className = "nav-utility";
      langButton.type = "button";
      langButton.dataset.langToggle = "true";
      langButton.dataset.noTranslate = "true";
      langButton.textContent = currentLang === "zh" ? "EN" : "中文";
      langButton.addEventListener("click", () => {
        currentLang = currentLang === "zh" ? "en" : "zh";
        storage.set("cm_lang", currentLang);
        translateRoot(document.body);
      });

      const accountButton = document.createElement("button");
      accountButton.className = "nav-utility";
      accountButton.type = "button";
      accountButton.dataset.accountToggle = "true";
      accountButton.dataset.noTranslate = "true";
      accountButton.textContent = "Log in";
      accountButton.addEventListener("click", openAuthModal);

      nav.append(langButton, accountButton);
    });
  }

  function setAuthStatus(user) {
    currentUser = user || null;
    updateAccountButtons();
    const modalUser = document.querySelector("[data-auth-user]");
    if (modalUser) modalUser.textContent = currentUser ? currentUser.email : "";
  }

  function authModalHtml() {
    return `
      <div class="auth-modal" data-auth-modal hidden>
        <div class="auth-backdrop" data-auth-close></div>
        <section class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button class="auth-close" type="button" data-auth-close aria-label="Close">×</button>
          <p class="eyebrow">ChinaMigo Account</p>
          <h2 id="auth-title">Log in with email</h2>
          <p class="auth-intro">Save your contact details and return to your China planning conversation.</p>
          <p class="auth-user" data-auth-user></p>
          <form data-auth-form>
            <label>
              Name
              <input name="name" autocomplete="name" />
            </label>
            <label>
              Email
              <input name="email" autocomplete="email" type="email" required />
            </label>
            <label>
              Password
              <input name="password" autocomplete="current-password" type="password" minlength="8" required />
            </label>
            <div class="auth-actions">
              <button class="pill-button dark" type="submit" data-auth-submit>Log in</button>
              <button class="text-link" type="button" data-auth-mode>Create account</button>
            </div>
          </form>
          <button class="auth-logout" type="button" data-auth-logout hidden>Logout</button>
          <p class="auth-status" data-auth-status aria-live="polite"></p>
        </section>
      </div>
    `;
  }

  function ensureAuthModal() {
    if (!document.querySelector("[data-auth-modal]")) {
      document.body.insertAdjacentHTML("beforeend", authModalHtml());
      bindAuthModal();
    }
  }

  function openAuthModal() {
    ensureAuthModal();
    const modal = document.querySelector("[data-auth-modal]");
    modal.hidden = false;
    modal.classList.add("is-open");
    renderAuthMode(false);
    modal.querySelector("input[name='email']")?.focus();
  }

  function closeAuthModal() {
    const modal = document.querySelector("[data-auth-modal]");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.hidden = true;
  }

  function renderAuthMode(registerMode) {
    const modal = document.querySelector("[data-auth-modal]");
    if (!modal) return;
    modal.dataset.mode = registerMode ? "register" : "login";
    modal.querySelector("#auth-title").textContent = currentUser ? "Your account" : registerMode ? "Create an account" : "Log in with email";
    modal.querySelector("[data-auth-submit]").textContent = registerMode ? "Create account" : "Log in";
    modal.querySelector("[data-auth-mode]").textContent = registerMode ? "Already have an account?" : "Create account";
    modal.querySelector("input[name='name']").closest("label").hidden = !registerMode;
    modal.querySelector("form").hidden = Boolean(currentUser);
    modal.querySelector("[data-auth-logout]").hidden = !currentUser;
    modal.querySelector("[data-auth-status]").textContent = "";
    translateRoot(modal);
  }

  function bindAuthModal() {
    document.querySelectorAll("[data-auth-close]").forEach((button) => button.addEventListener("click", closeAuthModal));
    document.querySelector("[data-auth-mode]")?.addEventListener("click", () => {
      const modal = document.querySelector("[data-auth-modal]");
      renderAuthMode(modal?.dataset.mode !== "register");
    });
    document.querySelector("[data-auth-logout]")?.addEventListener("click", async () => {
      await fetch("/api/visitor/logout", { method: "POST" });
      setAuthStatus(null);
      renderAuthMode(false);
    });
    document.querySelector("[data-auth-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const modal = document.querySelector("[data-auth-modal]");
      const status = modal.querySelector("[data-auth-status]");
      const submit = modal.querySelector("[data-auth-submit]");
      const registerMode = modal.dataset.mode === "register";
      status.textContent = registerMode ? "Creating account..." : "Logging in...";
      submit.disabled = true;
      try {
        const response = await fetch(registerMode ? "/api/visitor/register" : "/api/visitor/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to continue.");
        setAuthStatus(result.user);
        status.textContent = registerMode ? "Account created." : "Logged in.";
        renderAuthMode(false);
      } catch (error) {
        status.textContent = error.message || "Unable to continue.";
      } finally {
        submit.disabled = false;
      }
    });
  }

  async function loadVisitorSession() {
    try {
      const response = await fetch("/api/visitor/session");
      const result = await response.json();
      setAuthStatus(result.authenticated ? result.user : null);
    } catch {
      setAuthStatus(null);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    addHeaderControls();
    ensureAuthModal();
    loadVisitorSession();
    translateRoot(document.body);
  });
})();
