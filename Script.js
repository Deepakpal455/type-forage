'use strict';

/* ==========================================================================
   Word / quote banks
   ========================================================================== */

const WORD_BANK = [
  'the','of','and','to','in','is','you','that','it','he','was','for','on','are',
  'with','as','his','they','be','at','one','have','this','from','or','had','by',
  'word','but','what','some','we','can','out','other','were','all','there','when',
  'up','use','your','how','said','an','each','she','which','do','their','time',
  'if','will','way','about','many','then','them','write','would','like','so',
  'these','her','long','make','thing','see','him','two','has','look','more','day',
  'could','go','come','did','number','sound','no','most','people','my','over',
  'know','water','than','call','first','who','may','down','side','been','now',
  'find','any','new','work','part','take','get','place','made','live','where',
  'after','back','little','only','round','man','year','came','show','every',
  'good','me','give','our','under','name','very','through','just','form','sentence',
  'great','think','say','help','low','line','differ','turn','cause','much','mean',
  'before','move','right','boy','old','too','same','tell','does','set','three',
  'want','air','well','also','play','small','end','put','home','read','hand',
  'port','large','spell','add','even','land','here','must','big','high','such',
  'follow','act','why','ask','men','change','went','light','kind','off','need',
  'house','picture','try','us','again','animal','point','mother','world','near',
  'build','self','earth','father','head','stand','own','page','should','country',
  'found','answer','school','grow','study','still','learn','plant','cover','food'
];

const QUOTES = [
  "The only way to do great work is to love what you do, and if you have not found it yet, keep looking and do not settle.",
  "In the middle of difficulty lies opportunity, and those who look for it with patience will almost always find it waiting.",
  "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.",
  "Whether you think you can or you think you cannot, you are right, and either belief will shape everything you attempt.",
  "The future belongs to those who believe in the beauty of their dreams, and who wake up each day willing to chase them.",
  "Success is not final, failure is not fatal, it is the courage to continue that counts on the long road forward."
];

const PROGRAMMING_SNIPPET =
  "function forge(input) { const output = input.map(x => x * 2).filter(x => x > 0); return output.reduce((a, b) => a + b, 0); }";

/* ==========================================================================
   Utilities
   ========================================================================== */

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function shuffleSample(arr, n) {
  const copy = [...arr];
  const out = [];

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
  }

  return out;
}

function showToast(msg) {
  const toast = $('#toast');

  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('show');

  clearTimeout(showToast._t);

  showToast._t = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

/* ==========================================================================
   Safe localStorage
   ========================================================================== */

const SafeStorage = (() => {

  const memory = {};

  function get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memory, key)
        ? memory[key]
        : fallback;
    }
  }

  function set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memory[key] = String(value);
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      delete memory[key];
    }
  }

  return {
    get,
    set,
    remove
  };

})();

/* ==========================================================================
   LIVE TYPING DASHBOARD
   ========================================================================== */

const Dashboard = (() => {

  const STORAGE_KEY = 'typeforge-typing-records-v1';

  let records = [];

  /* ------------------------------------------------------------------------
     Load saved records
     ------------------------------------------------------------------------ */

  function load() {

    try {

      const saved = SafeStorage.get(STORAGE_KEY, '[]');

      const parsed = JSON.parse(saved);

      records = Array.isArray(parsed) ? parsed : [];

    } catch (error) {

      console.error(
        'Could not load typing records:',
        error
      );

      records = [];

    }

  }

  /* ------------------------------------------------------------------------
     Save records
     ------------------------------------------------------------------------ */

  function save() {

    SafeStorage.set(
      STORAGE_KEY,
      JSON.stringify(records)
    );

  }

  /* ------------------------------------------------------------------------
     Update Current WPM while the user is typing
     ------------------------------------------------------------------------ */

  function updateLive(wpm, accuracy) {

    const currentWpm =
      document.getElementById('dashboard-wpm');

    if (currentWpm) {
      currentWpm.textContent = Math.round(wpm || 0);
    }

  }

  /* ------------------------------------------------------------------------
     Save a completed test
     ------------------------------------------------------------------------ */

  function saveTest(result) {

    const record = {

      id:
        Date.now().toString() +
        '-' +
        Math.random().toString(36).slice(2),

      wpm: Number(result.wpm) || 0,

      accuracy:
        Number(result.accuracy) || 0,

      raw:
        Number(result.raw) || 0,

      time:
        Number(result.time) || 0,

      mode:
        result.mode || 'time',

      date:
        new Date().toISOString()

    };

    records.push(record);

    save();

    updateDashboard();

  }

  /* ------------------------------------------------------------------------
     Calculate dashboard statistics
     ------------------------------------------------------------------------ */

  function getStats() {

    if (!records.length) {

      return {

        tests: 0,

        averageWpm: 0,

        averageAccuracy: 100,

        currentWpm: 0,

        bestWpm: 0,

        latestAccuracy: 100

      };

    }

    const current =
      records[records.length - 1];

    const totalWpm =
      records.reduce(
        (sum, test) =>
          sum + Number(test.wpm || 0),
        0
      );

    const totalAccuracy =
      records.reduce(
        (sum, test) =>
          sum + Number(test.accuracy || 0),
        0
      );

    const bestWpm =
      Math.max(
        ...records.map(
          test => Number(test.wpm || 0)
        )
      );

    return {

      tests: records.length,

      averageWpm:
        totalWpm / records.length,

      averageAccuracy:
        totalAccuracy / records.length,

      currentWpm:
        Number(current.wpm || 0),

      bestWpm,

      latestAccuracy:
        Number(current.accuracy || 0)

    };

  }

  /* ------------------------------------------------------------------------
     Update dashboard HTML
     ------------------------------------------------------------------------ */

  function updateDashboard() {

    const stats = getStats();

    const testsElement =
      document.getElementById(
        'dashboard-tests'
      );

    const accuracyElement =
      document.getElementById(
        'dashboard-accuracy'
      );

    const currentWpmElement =
      document.getElementById(
        'dashboard-wpm'
      );

    const bestWpmElement =
      document.getElementById(
        'dashboard-best'
      );

    const averageWpmElement =
      document.getElementById(
        'dashboard-average-wpm'
      );

    const latestAccuracyElement =
      document.getElementById(
        'dashboard-latest-accuracy'
      );


    if (testsElement) {

      testsElement.textContent =
        stats.tests;

    }


    if (accuracyElement) {

      accuracyElement.textContent =
        stats.averageAccuracy.toFixed(1) + '%';

    }


    if (currentWpmElement) {

      currentWpmElement.textContent =
        stats.currentWpm;

    }


    if (bestWpmElement) {

      bestWpmElement.textContent =
        stats.bestWpm;

    }


    if (averageWpmElement) {

      averageWpmElement.textContent =
        Math.round(stats.averageWpm);

    }


    if (latestAccuracyElement) {

      latestAccuracyElement.textContent =
        stats.latestAccuracy + '%';

    }

  }

  /* ------------------------------------------------------------------------
     Optional recent-test list
     ------------------------------------------------------------------------ */

  function renderRecentTests() {

    const container = document.getElementById("recent-tests");

    if (!container) return;

    if (records.length === 0) {
        container.innerHTML = `
            <div class="recent-empty">
                Complete a test to see your records here.
            </div>
        `;
        return;
    }

    const recent = records.slice(-10).reverse();

    container.innerHTML = recent.map(test => {

        const date = new Date(test.date);

        const formattedDate = date.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        const formattedTime = date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        return `
            <div class="recent-test">

                <div class="recent-left">
                    <strong>${test.wpm} WPM</strong>
                    <span>${test.accuracy}% Accuracy</span>
                </div>

                <div class="recent-right">
                    <div>${formattedDate}</div>
                    <div>${formattedTime}</div>
                </div>

            </div>
        `;

    }).join("");

}

  /* ------------------------------------------------------------------------
     Clear all records
     ------------------------------------------------------------------------ */

  function clear() {

    records = [];

    save();

    updateDashboard();

    renderRecentTests();

  }

  /* ------------------------------------------------------------------------
     Initialise
     ------------------------------------------------------------------------ */

  function init() {

  load();

  updateDashboard();

  renderRecentTests();


  // Connect the Clear History button
  const clearButton =
    document.getElementById('clear-history-btn');

  if (clearButton) {

    clearButton.addEventListener('click', () => {

      const confirmed =
        window.confirm(
          'Are you sure you want to clear all typing history?'
        );

      if (!confirmed) {
        return;
      }


      // Delete all saved typing records
      records = [];

      save();


      // Reset the dashboard
      updateDashboard();

      renderRecentTests();


      // Reset live WPM
      const currentWpm =
        document.getElementById('dashboard-wpm');

      if (currentWpm) {
        currentWpm.textContent = '0';
      }


      // Reset dashboard values
      const tests =
        document.getElementById('dashboard-tests');

      const accuracy =
        document.getElementById('dashboard-accuracy');

      const averageWpm =
        document.getElementById('dashboard-average-wpm');

      const latestAccuracy =
        document.getElementById(
          'dashboard-latest-accuracy'
        );

      const bestWpm =
        document.getElementById('dashboard-best');


      if (tests) {
        tests.textContent = '0';
      }

      if (accuracy) {
        accuracy.textContent = '100%';
      }

      if (averageWpm) {
        averageWpm.textContent = '0';
      }

      if (latestAccuracy) {
        latestAccuracy.textContent = '100%';
      }

      if (bestWpm) {
        bestWpm.textContent = '0';
      }


      showToast(
        'Typing history cleared'
      );

    });

  }

}

  return {

    init,

    updateLive,

    saveTest,

    updateDashboard,

    renderRecentTests,

    clear,

    getStats

  };

})();

/* ==========================================================================
   Theme
   ========================================================================== */

const ThemeModule = (() => {

  function init() {

    const saved =
      SafeStorage.get(
        'typeforge-theme',
        'dark'
      );

    document.body.dataset.theme =
      saved;

    const toggle =
      $('#theme-toggle');

    if (toggle) {
      toggle.addEventListener(
        'click',
        toggleTheme
      );
    }

  }

  function toggleTheme() {

    const next =
      document.body.dataset.theme === 'dark'
        ? 'light'
        : 'dark';

    document.body.dataset.theme =
      next;

    SafeStorage.set(
      'typeforge-theme',
      next
    );

  }

  return {
    init
  };

})();

/* ==========================================================================
   Router
   ========================================================================== */

const Router = (() => {

  let current = 'landing';

  function init() {

    $all('[data-route]')
      .forEach(el => {

        el.addEventListener(
          'click',
          e => {

            e.preventDefault();

            const route =
              el.dataset.route;

            const scrollTarget =
              el.dataset.scroll;

            go(route);

            if (scrollTarget) {

              requestAnimationFrame(() => {

                const target =
                  document.getElementById(
                    scrollTarget
                  );

                if (target) {

                  target.scrollIntoView({
                    behavior: 'smooth'
                  });

                }

              });

            }

          }
        );

      });

  }

  function go(route) {

    if (route === current) {
      return;
    }

    $all('.view')
      .forEach(v => {
        v.hidden = true;
      });

    const target =
      $(`[data-view="${route}"]`);

    if (!target) return;

    target.hidden = false;

    target.style.animation = 'none';

    void target.offsetWidth;

    target.style.animation = '';

    current = route;

    window.scrollTo({
      top: 0,
      behavior:
        'instant' in window
          ? 'instant'
          : 'auto'
    });

    if (route === 'test') {

      TypingTest.activate();

    }

  }

  return {

    init,

    go,

    current: () => current

  };

})();

/* ==========================================================================
   Hero demo
   ========================================================================== */

const HeroDemo = (() => {

  const phrases = [

    'the quick engine tracks every keystroke in real time',

    'accuracy is measured character by character, not guessed',

    'fifteen seconds is all it takes to see your speed'

  ];

  let phraseIdx = 0;

  let charIdx = 0;

  let wpmDisplay = 0;

  let startedAt = null;


  function init() {

    const el =
      $('#hero-demo-text');

    if (!el) return;

    render(el);

  }


  function render(el) {

    const phrase =
      phrases[phraseIdx];

    if (charIdx === 0) {

      startedAt =
        performance.now();

    }

    const typed =
      phrase.slice(0, charIdx);

    const rest =
      phrase.slice(charIdx);


    el.innerHTML = `
      <span class="typed">
        ${escapeHtml(typed)}
      </span>
      <span class="cursor-blink">&nbsp;</span>
      <span>
        ${escapeHtml(rest)}
      </span>
    `;


    if (charIdx > 0) {

      const minutes =
        (performance.now() - startedAt)
        / 60000;

      const words =
        charIdx / 5;

      wpmDisplay =
        minutes > 0
          ? Math.round(words / minutes)
          : 0;

      const heroWpm =
        $('#hero-wpm');

      if (heroWpm) {

        heroWpm.textContent =
          Math.min(
            wpmDisplay,
            140
          );

      }

    }


    charIdx++;


    if (charIdx <= phrase.length) {

      setTimeout(
        () => render(el),
        34 + Math.random() * 55
      );

    } else {

      setTimeout(() => {

        charIdx = 0;

        phraseIdx =
          (phraseIdx + 1)
          % phrases.length;

        const heroWpm =
          $('#hero-wpm');

        if (heroWpm) {
          heroWpm.textContent = '0';
        }

        render(el);

      }, 1400);

    }

  }


  function escapeHtml(str) {

    return str.replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

  }

  return {
    init
  };

})();

/* ==========================================================================
   Typing Test engine
   ========================================================================== */

const TypingTest = (() => {

  let mode = 'time';

  let duration = 15;

  let wordCount = 25;

  let punctuation = false;

  let numbers = false;


  let words = [];

  let targetText = '';

  let chars = [];

  let typedLog = [];

  let extraChars = [];


  let cursor = 0;

  let started = false;

  let finished = false;

  let startTime = null;

  let timerId = null;

  let secondsElapsed = 0;

  let wpmHistory = [];


  let bestWpm =
    Number(
      sessionBest()
    );


  const els = {};


  function activate() {

    cacheEls();

    bindOnce();

    buildModeOptions();

    newTest();

  }


  function cacheEls() {

    els.controls =
      $('#test-controls');

    els.readoutTimer =
      $('#live-timer');

    els.readoutWpm =
      $('#live-wpm');

    els.readoutAcc =
      $('#live-acc');

    els.typeArea =
      $('#type-area');

    els.typeText =
      $('#type-text');

    els.hiddenInput =
      $('#hidden-input');

    els.focusHint =
      $('#focus-hint');

    els.restartBtn =
      $('#restart-btn');

    els.modeOptions =
      $('#mode-options');

  }


  let bound = false;


  function bindOnce() {

    if (bound) return;

    bound = true;


    $all(
      '.control-group [data-mode]'
    ).forEach(btn => {

      btn.addEventListener(
        'click',
        () => {

          $all('[data-mode]')
            .forEach(b =>
              b.classList.remove(
                'active'
              )
            );

          btn.classList.add('active');

          mode =
            btn.dataset.mode;

          buildModeOptions();

          newTest();

        }
      );

    });


    const punctuationButton =
      $('#opt-punctuation');

    if (punctuationButton) {

      punctuationButton.addEventListener(
        'click',
        e => {

          punctuation =
            !punctuation;

          e.currentTarget.setAttribute(
            'aria-pressed',
            String(punctuation)
          );

          newTest();

        }
      );

    }


    const numbersButton =
      $('#opt-numbers');

    if (numbersButton) {

      numbersButton.addEventListener(
        'click',
        e => {

          numbers =
            !numbers;

          e.currentTarget.setAttribute(
            'aria-pressed',
            String(numbers)
          );

          newTest();

        }
      );

    }


    els.typeArea.addEventListener(
      'click',
      () => els.hiddenInput.focus()
    );


    els.hiddenInput.addEventListener(
      'focus',
      () =>
        els.typeArea.classList.remove(
          'blurred'
        )
    );


    els.hiddenInput.addEventListener(
      'blur',
      () => {

        if (!finished) {

          els.typeArea.classList.add(
            'blurred'
          );

        }

      }
    );


    els.hiddenInput.addEventListener(
      'input',
      onInput
    );


    els.hiddenInput.addEventListener(
      'keydown',
      onKeydown
    );


    els.restartBtn.addEventListener(
      'click',
      newTest
    );


    document.addEventListener(
      'keydown',
      e => {

        if (
          e.key === 'Tab' &&
          Router.current() === 'test'
        ) {

          e.preventDefault();

          newTest();

        }


        if (
          e.key === 'Enter' &&
          Router.current() === 'landing'
        ) {

          Router.go('test');

        }

      }
    );


    const retryButton =
      $('#retry-btn');

    if (retryButton) {

      retryButton.addEventListener(
        'click',
        () => {

          Router.go('test');

          newTest();

        }
      );

    }


    const shareButton =
      $('#share-btn');

    if (shareButton) {

      shareButton.addEventListener(
        'click',
        copyResultToClipboard
      );

    }


    els.typeArea.classList.add(
      'blurred'
    );

  }


  function buildModeOptions() {

    els.modeOptions.innerHTML = '';


    if (mode === 'time') {

      [15, 30, 60, 120]
        .forEach(s => {

          const b =
            document.createElement(
              'button'
            );

          b.className =
            'chip' +
            (
              s === duration
                ? ' active'
                : ''
            );

          b.textContent = s;


          b.addEventListener(
            'click',
            () => {

              duration = s;

              $all(
                '#mode-options .chip'
              ).forEach(c =>
                c.classList.remove(
                  'active'
                )
              );

              b.classList.add(
                'active'
              );

              newTest();

            }
          );


          els.modeOptions.appendChild(
            b
          );

        });

    } else if (mode === 'words') {

      [10, 25, 50, 100]
        .forEach(n => {

          const b =
            document.createElement(
              'button'
            );

          b.className =
            'chip' +
            (
              n === wordCount
                ? ' active'
                : ''
            );

          b.textContent = n;


          b.addEventListener(
            'click',
            () => {

              wordCount = n;

              $all(
                '#mode-options .chip'
              ).forEach(c =>
                c.classList.remove(
                  'active'
                )
              );

              b.classList.add(
                'active'
              );

              newTest();

            }
          );


          els.modeOptions.appendChild(
            b
          );

        });

    } else {

      const label =
        document.createElement(
          'span'
        );

      label.className =
        'chip';

      label.style.cursor =
        'default';

      label.textContent =
        'random quote';

      els.modeOptions.appendChild(
        label
      );

    }

  }


  function applyTextOptions(str) {

    let out = str;


    if (numbers) {

      out =
        out
          .split(' ')
          .map(w =>
            Math.random() < 0.12
              ? String(
                  Math.floor(
                    Math.random() * 9000
                  ) + 100
                )
              : w
          )
          .join(' ');

    }


    if (punctuation) {

      out =
        out
          .split(' ')
          .map(w => {

            if (Math.random() < 0.1) {

              return w + ',';

            }

            if (Math.random() < 0.06) {

              return capitalize(w) + '.';

            }

            return w;

          })
          .join(' ');


      out =
        capitalize(out);


      if (!/[.?!]$/.test(out)) {

        out += '.';

      }

    }


    return out;

  }


  function capitalize(s) {

    return (
      s.charAt(0).toUpperCase()
      + s.slice(1)
    );

  }


  function buildTargetText() {

    if (mode === 'quote') {

      return QUOTES[
        Math.floor(
          Math.random() * QUOTES.length
        )
      ];

    }


    if (mode === 'time') {

      const raw =
        shuffleSample(
          WORD_BANK,
          220
        ).join(' ');

      return applyTextOptions(
        raw
      );

    }


    const raw =
      shuffleSample(
        WORD_BANK,
        wordCount
      ).join(' ');


    return applyTextOptions(
      raw
    );

  }


  function newTest() {

    clearInterval(timerId);


    started = false;

    finished = false;

    startTime = null;

    secondsElapsed = 0;

    cursor = 0;

    typedLog = [];

    wpmHistory = [];

    extraChars = [];


    targetText =
      buildTargetText();


    chars =
      targetText
        .split('')
        .map(ch => ({
          ch,
          status: 'pending'
        }));


    els.readoutTimer.textContent =
      mode === 'time'
        ? duration
        : '0';


    els.readoutWpm.textContent =
      '0';


    els.readoutAcc.textContent =
      '100%';


    els.hiddenInput.value =
      '';


    renderText();


    /*
     * Reset the live WPM dashboard
     * for the new test, but don't delete
     * saved records.
     */

    Dashboard.updateLive(
      0,
      100
    );


    els.hiddenInput.focus();

  }


  function renderText() {

    const frag =
      document.createDocumentFragment();

    const wrap =
      document.createElement(
        'span'
      );


    chars.forEach((c, i) => {

      const span =
        document.createElement(
          'span'
        );


      span.className =
        'char' +
        (
          c.status !== 'pending'
            ? ' ' + c.status
            : ''
        ) +
        (
          i === cursor
            ? ' current'
            : ''
        );


      span.textContent =
        c.ch === ' '
          ? '\u00A0'
          : c.ch;


      wrap.appendChild(
        span
      );

    });


    frag.appendChild(
      wrap
    );


    els.typeText.innerHTML =
      '';


    els.typeText.appendChild(
      frag
    );


    scrollCurrentIntoView();

  }


  function scrollCurrentIntoView() {

    const currentEl =
      els.typeText.querySelector(
        '.current'
      );


    if (currentEl) {

      const areaRect =
        els.typeText.getBoundingClientRect();

      const elRect =
        currentEl.getBoundingClientRect();


      if (
        elRect.top -
        areaRect.top >
        90
      ) {

        els.typeText.scrollTop += 60;

      }

    }

  }


  function onKeydown(e) {

    if (e.key === 'Backspace') {

      e.preventDefault();


      if (cursor > 0) {

        cursor--;

        chars[cursor].status =
          'pending';

        renderText();

        updateLiveStats();

      }


      return;

    }


    if (e.key === 'Tab') {

      e.preventDefault();

    }

  }


  function onInput(e) {

    const val =
      els.hiddenInput.value;


    els.hiddenInput.value =
      '';


    if (!val) return;


    for (const ch of val) {

      if (!started) {

        beginTest();

      }


      if (finished) {

        return;

      }


      if (cursor >= chars.length) {

        if (mode === 'time') {

          extendText();

        } else {

          break;

        }

      }


      const target =
        chars[cursor];


      const correct =
        ch === target.ch;


      target.status =
        correct
          ? 'correct'
          : 'incorrect';


      typedLog.push({
        correct,
        t: performance.now()
      });


      cursor++;


      /*
       * Update live statistics after
       * every typed character.
       */

      updateLiveStats();


      if (
        mode === 'words' &&
        cursor >= chars.length
      ) {

        finishTest();

        break;

      }


      if (
        mode === 'quote' &&
        cursor >= chars.length
      ) {

        finishTest();

        break;

      }

    }


    renderText();

  }


  function extendText() {

    const raw =
      shuffleSample(
        WORD_BANK,
        60
      ).join(' ');


    const extra =
      ' ' +
      applyTextOptions(raw);


    targetText += extra;


    extra
      .split('')
      .forEach(ch => {

        chars.push({
          ch,
          status: 'pending'
        });

      });

  }


  function beginTest() {

    started = true;

    startTime =
      performance.now();


    if (mode === 'time') {

      let remaining =
        duration;


      timerId =
        setInterval(() => {

          remaining--;

          secondsElapsed++;


          els.readoutTimer.textContent =
            remaining;


          updateLiveStats();


          if (remaining <= 0) {

            finishTest();

          }

        }, 1000);

    } else {

      timerId =
        setInterval(() => {

          secondsElapsed++;


          els.readoutTimer.textContent =
            secondsElapsed;


          updateLiveStats();

        }, 1000);

    }

  }


  function computeStats(uptoTime) {

    const elapsedMin =
      Math.max(
        (uptoTime - startTime) /
          60000,
        1 / 60000
      );


    const correct =
      chars.filter(
        c => c.status === 'correct'
      ).length;


    const incorrect =
      chars.filter(
        c => c.status === 'incorrect'
      ).length;


    const totalTyped =
      correct + incorrect;


    const wpm =
      Math.round(
        (correct / 5) /
        elapsedMin
      );


    const raw =
      Math.round(
        (totalTyped / 5) /
        elapsedMin
      );


    const acc =
      totalTyped > 0
        ? Math.round(
            (correct / totalTyped) * 100
          )
        : 100;


    return {

      wpm:
        Math.max(wpm, 0),

      raw:
        Math.max(raw, 0),

      acc,

      correct,

      incorrect

    };

  }


  function updateLiveStats() {

    if (!started || finished || !startTime) {
      return;
    }


    const now =
      performance.now();


    const s =
      computeStats(now);


    /*
     * Update the actual typing test.
     */

    els.readoutWpm.textContent =
      s.wpm;


    els.readoutAcc.textContent =
      s.acc + '%';


    /*
     * Save point for the result graph.
     */

    wpmHistory.push({

      t:
        secondsElapsed,

      wpm:
        s.wpm,

      raw:
        s.raw

    });


    /*
     * Update dashboard LIVE.
     */

    Dashboard.updateLive(
      s.wpm,
      s.acc
    );

  }


  function finishTest() {

    if (finished) {
      return;
    }


    finished = true;


    clearInterval(
      timerId
    );


    const endTime =
      performance.now();


    const s =
      computeStats(
        endTime
      );


    const missed =
      chars
        .slice(cursor)
        .filter(
          c => c.ch !== ' '
        )
        .length;


    const extra = 0;


    if (s.wpm > bestWpm) {

      bestWpm =
        s.wpm;

      sessionBest(
        bestWpm
      );

    }


    const testTime =
      secondsElapsed ||
      Math.max(
        1,
        Math.round(
          (endTime - startTime) /
          1000
        )
      );


    /*
     * IMPORTANT:
     *
     * Save this completed test
     * to the dashboard.
     */

    Dashboard.saveTest({

      wpm:
        s.wpm,

      accuracy:
        s.acc,

      raw:
        s.raw,

      time:
        testTime,

      mode:
        mode

    });


    /*
     * Show results.
     */

    ResultsView.show({

      wpm:
        s.wpm,

      raw:
        s.raw,

      acc:
        s.acc,

      correct:
        s.correct,

      incorrect:
        s.incorrect,

      missed,

      extra,

      time:
        testTime,

      best:
        bestWpm,

      history:
        wpmHistory

    });


    Router.go(
      'results'
    );

  }


  function copyResultToClipboard() {

    const wpmElement =
      $('#res-wpm');

    const accElement =
      $('#res-acc');


    const wpm =
      wpmElement
        ? wpmElement.textContent
        : '0';


    const acc =
      accElement
        ? accElement.textContent
        : '100%';


    const text =
      `I just typed ${wpm} WPM at ${acc} accuracy on Typeforge ⌁`;


    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {

      navigator.clipboard
        .writeText(text)
        .then(() => {

          showToast(
            'Result copied to clipboard'
          );

        })
        .catch(() => {

          showToast(text);

        });

    } else {

      showToast(text);

    }

  }


  let memBest = 0;


  function sessionBest(setVal) {

    if (setVal === undefined) {

      const stored =
        SafeStorage.get(
          'typeforge-best',
          '0'
        );

      return Number(stored) || 0;

    }


    SafeStorage.set(
      'typeforge-best',
      String(setVal)
    );

    memBest =
      Number(setVal) || 0;

  }


  return {
    activate
  };

})();

/* ==========================================================================
   Results view
   ========================================================================== */

const ResultsView = (() => {

  function show(data) {

    const wpm =
      $('#res-wpm');

    const best =
      $('#res-wpm-best');

    const acc =
      $('#res-acc');

    const raw =
      $('#res-raw');

    const chars =
      $('#res-chars');

    const time =
      $('#res-time');


    if (wpm) {

      wpm.textContent =
        data.wpm;

    }


    if (best) {

      best.textContent =
        'best: ' +
        data.best;

    }


    if (acc) {

      acc.textContent =
        data.acc +
        '%';

    }


    if (raw) {

      raw.textContent =
        data.raw;

    }


    if (chars) {

      chars.textContent =
        `${data.correct}/${data.incorrect}/${data.missed}/${data.extra}`;

    }


    if (time) {

      time.textContent =
        data.time +
        's';

    }


    drawGraph(
      data.history
    );

  }


  function drawGraph(history) {

    const svg =
      $('#result-graph');


    if (!svg) {
      return;
    }


    svg.innerHTML =
      '';


    if (!history.length) {
      return;
    }


    const w = 600;

    const h = 200;

    const pad = 12;


    const maxWpm =
      Math.max(
        ...history.map(
          p =>
            Math.max(
              p.wpm,
              p.raw
            )
        ),
        10
      );


    const stepX =
      (w - pad * 2) /
      Math.max(
        history.length - 1,
        1
      );


    const toPoints =
      key =>
        history
          .map((p, i) => {

            const x =
              pad +
              i * stepX;


            const y =
              h -
              pad -
              (p[key] /
                maxWpm) *
              (h - pad * 2);


            return `${x},${y}`;

          })
          .join(' ');


    const ns =
      'http://www.w3.org/2000/svg';


    /*
     * Grid lines
     */

    for (let i = 0; i <= 3; i++) {

      const y =
        pad +
        (
          i *
          (h - pad * 2)
        ) /
        3;


      const line =
        document.createElementNS(
          ns,
          'line'
        );


      line.setAttribute(
        'x1',
        pad
      );

      line.setAttribute(
        'x2',
        w - pad
      );

      line.setAttribute(
        'y1',
        y
      );

      line.setAttribute(
        'y2',
        y
      );

      line.setAttribute(
        'stroke',
        'currentColor'
      );

      line.setAttribute(
        'stroke-opacity',
        '0.08'
      );


      svg.appendChild(
        line
      );

    }


    /*
     * Raw WPM line
     */

    const rawLine =
      document.createElementNS(
        ns,
        'polyline'
      );


    rawLine.setAttribute(
      'points',
      toPoints('raw')
    );


    rawLine.setAttribute(
      'fill',
      'none'
    );


    rawLine.setAttribute(
      'stroke',
      'var(--accent-2)'
    );


    rawLine.setAttribute(
      'stroke-width',
      '2'
    );


    rawLine.setAttribute(
      'stroke-opacity',
      '0.5'
    );


    svg.appendChild(
      rawLine
    );


    /*
     * WPM line
     */

    const wpmLine =
      document.createElementNS(
        ns,
        'polyline'
      );


    wpmLine.setAttribute(
      'points',
      toPoints('wpm')
    );


    wpmLine.setAttribute(
      'fill',
      'none'
    );


    wpmLine.setAttribute(
      'stroke',
      'var(--accent)'
    );


    wpmLine.setAttribute(
      'stroke-width',
      '2.5'
    );


    svg.appendChild(
      wpmLine
    );

  }


  return {
    show
  };

})();

/* ==========================================================================
   Boot
   ========================================================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    ThemeModule.init();

    Router.init();

    HeroDemo.init();

    /*
     * Load saved typing records
     * and immediately update dashboard.
     */

    Dashboard.init();

  }
);