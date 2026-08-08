(function () {
  const zhMap = {
    "China Guides": "中国指南",
    "Practical guides for easier travel in China.": "让中国旅行更轻松的实用指南。",
    "Payments, rail, apps, eSIM, hotels and local tips for international visitors.": "为国际访客准备的支付、高铁、App、eSIM、酒店与本地提示。",
    "Search payments, rail, apps, eSIM...": "搜索支付、高铁、App、eSIM...",
    "Categories": "分类",
    "Guides": "指南",
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
    "China is easier with someone local.": "有本地人在，中国会更轻松。",
    "From arrival to payments, transport and everyday questions, we help international visitors move through China with calm local guidance.": "从抵达到支付、交通和日常问题，我们用从容的本地指引帮助国际访客在中国旅行。",
    "Arrival": "抵达",
    "Payments": "支付",
    "Transport": "交通",
    "Apps": "应用",
    "Everyday Help": "日常帮助",
    "We help international visitors handle arrival, payments, transport, apps and day-to-day questions with calm local guidance.": "我们用从容的本地指引，帮助国际访客处理抵达、支付、交通、App 和日常问题。",
    "We help international visitors move through China with local guidance, flexible planning and practical support for transport, payments, apps and everyday moments.": "我们用本地指引、灵活规划，以及交通、支付、App 和日常细节支持，帮助国际访客更顺畅地在中国旅行。",
    "How ChinaMigo helps": "ChinaMigo 如何提供帮助",
    "Arrival support": "抵达支持",
    "Airport pickup, first-day timing and next steps.": "机场接送、第一天时间安排和下一步指引。",
    "Airport pickup, first-day timing and where to go next.": "机场接送、第一天时间安排，以及下一步该去哪里。",
    "Transport clarity": "交通更清楚",
    "High-speed rail, private cars and station transfers.": "高铁、私人用车和车站换乘。",
    "High-speed rail, private cars and station transfers made easier.": "高铁、私人用车和车站换乘会更容易。",
    "Daily local help": "日常本地协助",
    "Payments, apps and small questions handled calmly.": "支付、App 和小问题都会被从容处理。",
    "Payments, apps, translation and small questions handled calmly.": "支付、App、翻译和小问题都会被从容处理。",
    "Flexible private days": "灵活私人行程",
    "Plans shaped around weather, energy and pace.": "根据天气、体力和节奏调整安排。",
    "Plans shaped around weather, energy, family needs and pace.": "根据天气、体力、家庭需求和节奏调整安排。",
    "Why ChinaMigo": "为什么选择 ChinaMigo",
    "Built for the parts of China that feel unfamiliar.": "为中国旅行中容易感到陌生的部分而设计。",
    "Built for the moments that make China feel unfamiliar.": "为那些让中国显得陌生的时刻而设计。",
    "Arrive with confidence": "抵达时更安心",
    "Airport pickup, first-day timing and payment setup made easier.": "机场接送、第一天时间安排和支付设置会更容易。",
    "Payments, transport, apps and arrival details made easier before and during your trip.": "行前和旅途中，让支付、交通、App 和抵达细节更容易。",
    "Move like a local": "像本地人一样移动",
    "Routes shaped around real neighborhoods, food and daily life.": "路线围绕真实街区、食物和日常生活。",
    "Routes shaped around real neighborhoods, food, daily life and local rhythm, not only famous landmarks.": "路线围绕真实街区、食物、日常生活和本地节奏，而不只是著名景点。",
    "Travel without pressure": "没有压力地旅行",
    "Private days that can adjust around weather, energy and pace.": "私人行程可以根据天气、体力和节奏调整。",
    "Private, flexible days planned around your pace, family needs, weather and energy.": "私人灵活的一天，会围绕你的节奏、家庭需求、天气和体力来安排。",
    "Real moments": "真实瞬间",
    "Moments from the road.": "旅途中的真实片刻。",
    "A look at the routes, cafés, transfers and everyday scenes guests experience with ChinaMigo.": "看看客人与 ChinaMigo 一起经历的路线、咖啡馆、换乘和日常场景。",
    "Real travelers. Real local moments.": "真实旅行者。真实本地瞬间。",
    "Hosted across China, shaped by local people and the small details that make each day easier.": "由本地人参与设计与接待，关注那些让每天更轻松的小细节。",
    "Meet the people": "认识团队",
    "The people shaping each journey.": "塑造每段旅程的人。",
    "Local people behind the routes, messages and support.": "路线、沟通和支持背后的本地团队。",
    "Guoer": "Guoer",
    "Chongqing native · Photographer · Experience designer": "重庆本地人 · 摄影师 · 体验设计师",
    "Chongqing native · Photographer · Local experience designer": "重庆本地人 · 摄影师 · 本地体验设计师",
    "Designs routes around neighborhoods, food, light and real daily life.": "围绕街区、食物、光线和真实日常生活设计路线。",
    "Janet Zhang": "Janet Zhang",
    "Travel writer · Cultural tourism planner": "旅行作者 · 文化旅游策划",
    "Shapes stories, routes and guest communication for international travelers.": "为国际旅行者打磨故事、路线和客人沟通。",
    "Helps shape stories, routes and guest communication for international travelers.": "为国际旅行者打磨故事、路线和客人沟通。",
    "Local Guides": "本地向导",
    "English-speaking local hosts · Major Chinese cities": "英文接待本地向导 · 中国主要城市",
    "Help guests move through each day with context and calm.": "用语境和从容感帮助客人度过每一天。",
    "Support guests with local context, practical questions and flexible travel days.": "用本地语境、实际问题解答和灵活行程支持客人。",
    "What makes us different": "我们的不同之处",
    "How we differ from standard tours.": "我们和普通旅行团的不同。",
    "More local, more practical and less rushed than a standard tour.": "比普通旅行团更本地、更实用，也更不赶。",
    "Beyond landmarks": "不只看地标",
    "Classic highlights plus neighborhoods, markets, cafés and daily life.": "经典亮点之外，也有街区、市场、咖啡馆和日常生活。",
    "We include classic highlights, but also local neighborhoods, markets, cafés and everyday city life.": "我们会安排经典亮点，也会加入本地街区、市场、咖啡馆和日常城市生活。",
    "Everyday travel help": "日常旅行协助",
    "Payments, transport, apps, tickets and reservations made easier.": "支付、交通、App、票务和预订会更容易。",
    "Practical support": "实用支持",
    "We help with payments, transport, apps, tickets, reservations and small problems that often confuse first-time visitors.": "我们协助支付、交通、App、票务、预订，以及第一次来中国常遇到的小问题。",
    "No rushed group schedule. Routes can shift with weather, energy, kids, seniors or personal interests.": "没有赶场式团队行程。路线可以根据天气、体力、孩子、长辈或个人兴趣调整。",
    "Atmosphere-first planning": "先考虑氛围",
    "Timing, light and photo moments are considered from the start.": "从一开始就考虑时间、光线和适合拍照的瞬间。",
    "We consider timing, light, photo moments and local rhythm so the day feels natural, not mechanical.": "我们考虑时间、光线、拍照瞬间和本地节奏，让一天自然发生，而不是机械执行。",
    "Traveler notes": "旅行者笔记",
    "Small things guests remembered.": "客人记住的小事。",
    "First day felt easier": "第一天更轻松",
    "First arrival felt easier": "第一次抵达更轻松",
    "The pickup and payment setup made our first day in China much less stressful.": "接送和支付设置让我们在中国的第一天少了很多压力。",
    "— First-time visitor from Australia": "— 来自澳大利亚的首次访客",
    "Places we would not find alone": "那些我们自己找不到的地方",
    "Local moments, not tourist scenes": "本地瞬间，而不只是游客场景",
    "We saw neighborhoods and small places we would never have found on our own.": "我们看到了自己根本找不到的街区和小地方。",
    "— Couple traveler, United Kingdom": "— 来自英国的情侣旅行者",
    "The plan adjusted with us": "计划会跟着我们调整",
    "Flexible and personal": "灵活而个人化",
    "When our timing changed, the plan adjusted without making the day feel rushed.": "时间变化时，计划也跟着调整，但一天并没有变得匆忙。",
    "— Family traveler, Singapore": "— 来自新加坡的家庭旅行者",
    "Ready to plan your China stay?": "准备规划你的中国停留了吗？",
    "Tell us your city and travel dates. We’ll suggest the right next step.": "告诉我们你的城市和旅行日期，我们会建议合适的下一步。",
    "Tell us where you are going, and we will help shape the right route, support or local experience.": "告诉我们你要去哪里，我们会帮你安排合适的路线、支持或本地体验。",
    "Plan My China Trip": "规划我的中国之旅",
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
  const isStaticPreview = Boolean(window.__CHINAMIGO_STATIC__);
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
    },
    remove(key) {
      delete memoryStore[key];
      try {
        window.localStorage?.removeItem(key);
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
      if (isStaticPreview) storage.remove("cm_static_user");
      else await fetch("/api/visitor/logout", { method: "POST" });
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
        if (isStaticPreview) {
          const formData = Object.fromEntries(new FormData(event.currentTarget));
          const user = {
            name: formData.name || "",
            email: formData.email || ""
          };
          storage.set("cm_static_user", JSON.stringify(user));
          setAuthStatus(user);
          status.textContent = registerMode ? "Account saved for this preview." : "Logged in for this preview.";
          renderAuthMode(false);
          return;
        }
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
    if (isStaticPreview) {
      try {
        const savedUser = JSON.parse(storage.get("cm_static_user") || "null");
        setAuthStatus(savedUser);
      } catch {
        setAuthStatus(null);
      }
      return;
    }
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
