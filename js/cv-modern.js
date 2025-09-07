const texts = [
  {
    "lang": "en",
    "text": {
      contactInfo: {
        name: "Jingtong (Jensen Arcueid) Peng",
        position: "Software Engineer",
        profilePicture: "icons/profile.png",
        websites: [
          { name: "Portfolio", url: "https://www.arcueidshiki.uk/" },
          {
            name: "Best Agile Practices & CV",
            url: "https://cv.arcueidshiki.uk/",
          },
        ],
        phone: ["+61 413993029", "+86 15776692817"],
        email: ["24323312@student.uwa.edu.au", "pengjingtong@pku.edu.cn"],
        socialLinks: [
          {
            icon: "icons/email.png",
            url: "mailto:24323312@student.uwa.edu.au",
          },
          {
            icon: "icons/linkedin.svg",
            url: "https://www.linkedin.com/in/jingtong-peng-3068672b6/",
          },
          {
            icon: "icons/github.svg",
            url: "https://github.com/ArcueidShiki",
          },
          { icon: "icons/logo.png", url: "https://www.arcueidshiki.uk/" },
        ],
      },
      profile: {
        title: "Profile",
        content: [
          "Results-driven software engineer with a strong background in C++ development, backend systems, and full-stack applications.",
          "Over 1.5 years of experience at Huawei, specializing in performance optimization, debugging tools, and system architecture.",
          "Currently pursuing a Master of Information Technology at UWA, seeking software engineering roles in Australia. Passionate about building scalable, efficient, and innovative solutions.",
        ],
      },
      workexperience: {
        title: "Work Experience",
        content: [
          {
            position: "Terminal Software Engineer",
            company: "Huawei Technologies Co., Ltd.",
            icon: "icons/company/huawei.png",
            duration: "09/2022 - 02/2024",
            location: "Beijing, China",
            description: [
              "Developed and maintained debugging and performance tuning tools (Hiperf) for HarmonyOS using C++, Python, and Bash.",
              "Enhanced crash analysis tools, implementing stack concatenation and Flame Graph visualization, reducing debugging time by 40%.",
              "Designed automated testing scripts for CPU/memory performance evaluation, improving system efficiency.",
              "Managed Git/Repo-based repositories in a large-scale development environment.",
            ],
          },
          {
            position: "Full Stack Developer",
            company: "Bytedance",
            icon: "icons/company/bytedance.png",
            duration: "02/2021 - 04/2022",
            location: "Chongqing, China",
            description: [
              "Developing and maintaining web applications for a hospital using Java, Spring Boot, and related backend technologies, ensuring secure and efficient healthcare data management.",
              "Collaborating with cross-functional teams, including UI/UX designers, product managers, and other developers, to build high-quality, scalable hospital management systems.",
              "Implementing responsive and user-friendly designs while ensuring cross-browser compatibility and seamless integration with medical databases.",
              "Participating in code reviews, optimizing backend performance, and providing constructive feedback to improve overall software quality.",
            ],
          },
        ],
      },
      projects: {
        title: "Projects",
        content: [
          {
            name: "Stock PaperTrading",
            link: "https://github.com/ArcueidShiki/DataAnalyticsApplication",
            description: "A US stock market paper trading web application",
            technologies: ["Flask", "Sqlalchemy", "Echarts", "bootstrap", "JWT"],
          },
          {
            name: "Hiperf",
            link: "https://gitee.com/openharmony/developtools_hiperf",
            description: "A HarmonyOs System Performance Debugging Tool.",
            technologies: ["C/C++", "LinuxPerf", "AOSP", "Python", "ADB"],
          },
          {
            name: "Remote Control",
            link: "https://github.com/ArcueidShiki/RemoteControl",
            description: "A Windows Remote Control Application, Screen watch, keyboard and Mouse control.",
            technologies: ["C/C++", "TCP/IP", "MFC", "IOCP", "QT"],
          },
          {
            name: "Penni",
            link: "https://github.com/codersforcauses/penni",
            description: "A mobile application that helps retirees find part-time jobs.",
            technologies: ["React", "Nextjs", "TailwindCss", "NPM"],
          },
          {
            name: "IOT Smart Entry System",
            link: "https://github.com/ArcueidShiki/SmartEntrySystem",
            description: "A IOT based face recognition system for entry control.",
            technologies: ["RaspberryPi", "OpenCV", "Flask", "MQTT", "Tensorflow"],
          },
          {
            name: "Best Agile Practice & CV",
            link: "https://github.com/ArcueidShiki/bpcv",
            description: "An uni individual project that helps students to build their CV.",
            technologies: ["HTML", "CSS", "JavaScript", "jQuery", "WebGL", "OpenGL Shader"],
          },
          {
            name: "Portfolio",
            link: "https://www.arcueidshiki.uk/",
            description: "A personal portfolio website showcasing my projects and skills.",
            technologies: ["Threejs", "Vite", "Blender"],
          },
        ],
      },
      skills: {
        title: "Skills",
        content: [
          {
            category: "Programming Languages",
            items: [
              { name: "C", iconUrl: "https://skillicons.dev/icons?i=c" },
              { name: "C++", iconUrl: "https://skillicons.dev/icons?i=cpp" },
              { name: "Bash", iconUrl: "https://skillicons.dev/icons?i=bash" },
              { name: "JavaScript", iconUrl: "https://skillicons.dev/icons?i=js" },
              { name: "Python", iconUrl: "https://skillicons.dev/icons?i=py" },
              { name: "Java", iconUrl: "https://skillicons.dev/icons?i=java" },
              { name: "TypeScript", iconUrl: "https://skillicons.dev/icons?i=ts" },
            ],
          },
          {
            category: "Backend Development",
            items: [
              { name: "Linux Server", iconUrl: "https://skillicons.dev/icons?i=linux" },
              { name: "Windows IOCP", iconUrl: "https://skillicons.dev/icons?i=windows" },
              { name: "Redis", iconUrl: "https://skillicons.dev/icons?i=redis" },
              { name: "SpringBoot", iconUrl: "https://skillicons.dev/icons?i=spring" },
              { name: "Flask", iconUrl: "https://skillicons.dev/icons?i=flask" },
            ],
          },
          {
            category: "Frontend Development",
            items: [
              { name: "Three.js", iconUrl: "https://skillicons.dev/icons?i=threejs" },
              { name: "React", iconUrl: "https://skillicons.dev/icons?i=react" },
              { name: "Next.js", iconUrl: "https://skillicons.dev/icons?i=nextjs" },
              { name: "Vue.js", iconUrl: "https://skillicons.dev/icons?i=vuejs" },
              { name: "HTML", iconUrl: "https://skillicons.dev/icons?i=html" },
              { name: "CSS", iconUrl: "https://skillicons.dev/icons?i=css" },
              { name: "Bootstrap", iconUrl: "https://skillicons.dev/icons?i=bootstrap" },
              { name: "QT", iconUrl: "https://skillicons.dev/icons?i=qt" },
              { name: "TailwindCSS", iconUrl: "https://skillicons.dev/icons?i=tailwindcss" },
            ],
          },
          {
            category: "Database",
            items: [
              { name: "MySQL", iconUrl: "https://skillicons.dev/icons?i=mysql" },
              { name: "Sqlite", iconUrl: "https://skillicons.dev/icons?i=sqlite" },
              { name: "MongoDB", iconUrl: "https://skillicons.dev/icons?i=mongodb" },
            ],
          },
          {
            category: "DevOps",
            items: [
              { name: "Git", iconUrl: "https://skillicons.dev/icons?i=git" },
              { name: "Docker", iconUrl: "https://skillicons.dev/icons?i=docker" },
              { name: "AWS", iconUrl: "https://skillicons.dev/icons?i=aws" },
              { name: "Cloudflare", iconUrl: "https://skillicons.dev/icons?i=cloudflare" },
            ],
          },
          {
            category: "Embedded Systems",
            items: [
              { name: "Arduino", iconUrl: "https://skillicons.dev/icons?i=arduino" },
              { name: "Raspberry Pi", iconUrl: "https://skillicons.dev/icons?i=raspberrypi" },
            ],
          },
        ],
      },
      education: {
        title: "Education",
        content: [
          {
            degree: "Master of Information Technology",
            institution: "The University of Western Australia",
            logo: "icons/edu/uwa.png",
            location: "Perth, Australia",
            year: "02/2024 - 12/2025",
          },
          {
            degree: "dropout",
            institution: "Peking University",
            logo: "icons/edu/pku.png",
            location: "Beijing, China",
            year: "2021",
          },
          {
            degree: "Bachelor of Pharmacy",
            institution: "Harbin Medical University",
            logo: "icons/edu/hmu.png",
            location: "Harbin, China",
            year: "09/2015 - 07/2019",
          },
        ],
      },
      languages: {
        title: "Languages",
        content: [
          { language: "English", proficiency: "Fluent" },
          { language: "Chinese", proficiency: "Native" },
          { language: "Japanese", proficiency: "Basic" },
        ],
      },
    },
  },
  {
    "lang": "jp",
    "text": {
      contactInfo: {
        name: "彭景通 (Jensen Arcueid)",
        position: "ソフトウェアエンジニア",
        profilePicture: "icons/profile.png",
        websites: [
          { name: "ポートフォリオ", url: "https://www.arcueidshiki.uk/" },
          {
            name: "ベストアジャイルプラクティス&履歴書",
            url: "https://cv.arcueidshiki.uk/",
          },
        ],
        phone: ["+61 413993029", "+86 15776692817"],
        email: ["24323312@student.uwa.edu.au", "pengjingtong@pku.edu.cn"],
        socialLinks: [
          {
            icon: "icons/email.png",
            url: "mailto:24323312@student.uwa.edu.au",
          },
          {
            icon: "icons/linkedin.svg",
            url: "https://www.linkedin.com/in/jingtong-peng-3068672b6/",
          },
          {
            icon: "icons/github.svg",
            url: "https://github.com/ArcueidShiki",
          },
          { icon: "icons/logo.png", url: "https://www.arcueidshiki.uk/" },
        ],
      },
      profile: {
        title: "プロフィール",
        content: [
          "C++開発、バックエンドシステム、フルスタックアプリケーションの豊富な経験を持つ結果重視のソフトウェアエンジニア。",
          "華為で1.5年以上の経験を持ち、パフォーマンス最適化、デバッグツール、システムアーキテクチャを専門とする。",
          "現在、UWAで情報技術修士課程を履修中で、オーストラリアでソフトウェアエンジニアのポジションを求めている。スケーラブルで効率的で革新的なソリューションの構築に情熱を持っている。",
        ],
      },
      workexperience: {
        title: "職歴",
        content: [
          {
            position: "ターミナルソフトウェアエンジニア",
            company: "華為技術有限公司",
            icon: "icons/company/huawei.png",
            duration: "2022年09月 - 2024年02月",
            location: "中国 北京",
            description: [
              "C++、Python、Bashを使用してHarmonyOS用のデバッグとパフォーマンスチューニングツール（Hiperf）を開発・保守。",
              "クラッシュ分析ツールを強化し、スタック連結とFlame Graphビジュアライゼーションを実装し、デバッグ時間を40％削減。",
              "CPU/メモリパフォーマンス評価の自動テストスクリプトを設計し、システム効率を向上。",
              "大規模開発環境でGit/Repoベースのリポジトリを管理。",
            ],
          },
          {
            position: "フルスタック開発者",
            company: "バイトダンス",
            icon: "icons/company/bytedance.png",
            duration: "2021年02月 - 2022年04月",
            location: "中国 重慶",
            description: [
              "Java、Spring Boot、関連バックエンド技術を使用して病院向けのWebアプリケーションを開発・保守し、安全で効率的な医療データ管理を確保。",
              "UI/UXデザイナー、プロダクトマネージャー、その他の開発者を含むクロスファンクショナルチームと協力し、高品質でスケーラブルな病院管理システムを構築。",
              "レスポンシブでユーザーフレンドリーなデザインを実装し、クロスブラウザ互換性と医療データベースとのシームレスな統合を確保。",
              "コードレビューに参加し、バックエンドパフォーマンスを最適化し、全体的なソフトウェア品質を向上させるための建設的なフィードバックを提供。",
            ],
          },
        ],
      },
      projects: {
        title: "プロジェクト",
        content: [
          {
            name: "株式ペーパートレーディング",
            link: "https://github.com/ArcueidShiki/DataAnalyticsApplication",
            description: "米国株式市場のペーパートレーディングWebアプリケーション",
            technologies: ["Flask", "Sqlalchemy", "Echarts", "bootstrap", "JWT"],
          },
          {
            name: "Hiperf",
            link: "https://gitee.com/openharmony/developtools_hiperf",
            description: "HarmonyOSシステムパフォーマンスデバッグツール",
            technologies: ["C/C++", "LinuxPerf", "AOSP", "Python", "ADB"],
          },
          {
            name: "リモートコントロール",
            link: "https://github.com/ArcueidShiki/RemoteControl",
            description: "Windowsリモートコントロールアプリケーション、画面監視、キーボードとマウス制御",
            technologies: ["C/C++", "TCP/IP", "MFC", "IOCP", "QT"],
          },
        ],
      },
      skills: {
        title: "スキル",
        content: [
          {
            category: "プログラミング言語",
            items: [
              { name: "C", iconUrl: "https://skillicons.dev/icons?i=c" },
              { name: "C++", iconUrl: "https://skillicons.dev/icons?i=cpp" },
              { name: "Bash", iconUrl: "https://skillicons.dev/icons?i=bash" },
              { name: "JavaScript", iconUrl: "https://skillicons.dev/icons?i=js" },
              { name: "Python", iconUrl: "https://skillicons.dev/icons?i=py" },
              { name: "Java", iconUrl: "https://skillicons.dev/icons?i=java" },
              { name: "TypeScript", iconUrl: "https://skillicons.dev/icons?i=ts" },
            ],
          },
        ],
      },
      education: {
        title: "学歴",
        content: [
          {
            degree: "情報技術修士",
            institution: "西オーストラリア大学",
            logo: "icons/edu/uwa.png",
            location: "オーストラリア パース",
            year: "2024年02月 - 2025年12月",
          },
          {
            degree: "中退",
            institution: "北京大学",
            logo: "icons/edu/pku.png",
            location: "中国 北京",
            year: "2021年",
          },
          {
            degree: "薬学士",
            institution: "ハルビン医科大学",
            logo: "icons/edu/hmu.png",
            location: "中国 ハルビン",
            year: "2015年09月 - 2019年07月",
          },
        ],
      },
      languages: {
        title: "言語",
        content: [
          { language: "英語", proficiency: "流暢" },
          { language: "中国語", proficiency: "母国語" },
          { language: "日本語", proficiency: "基礎" },
        ],
      },
    },
  },
  {
    "lang": "zh",
    "text": {} // Will be loaded from zh.json file
  }
];

// Modern CV Layout Functions
function loadContactInfo(data) {
  const contactHTML = `
    <div class="cv-container">
      <div class="cv-header">
        <div class="header-content">
          <div class="header-info">
            <h1>${data.contactInfo.name}</h1>
            <p class="position">${data.contactInfo.position}</p>
            <div class="contact-links">
              ${data.contactInfo.email.map(email => 
                `<a href="mailto:${email}"><span>✉</span> ${email}</a>`
              ).join('')}
              ${data.contactInfo.phone.map(phone => 
                `<a href="tel:${phone}"><span>📞</span> ${phone}</a>`
              ).join('')}
              ${data.contactInfo.socialLinks.map(link => 
                `<a href="${link.url}" target="_blank">
                  <img src="${link.icon}" alt="social" width="16" height="16" style="filter: invert(1);">
                </a>`
              ).join('')}
            </div>
          </div>
          <img src="${data.contactInfo.profilePicture}" alt="Profile Picture" class="profile-picture">
        </div>
      </div>
      <div class="cv-content">
  `;
  $("main").append(contactHTML);
}

function LoadProfile(data) {
  const profileHTML = `
    <div class="section">
      <h2 class="section-title">${data.profile.title}</h2>
      <div class="profile-content">
        ${data.profile.content.map(paragraph => `<p>${paragraph}</p>`).join('')}
      </div>
    </div>
  `;
  $("main").append(profileHTML);
}

function LoadWorkExperience(data) {
  const experienceHTML = `
    <div class="section">
      <h2 class="section-title">${data.workexperience.title}</h2>
      ${data.workexperience.content.map(exp => `
        <div class="experience-item">
          <div class="experience-header">
            <img src="${exp.icon}" alt="company logo" class="company-logo">
            <div>
              <div class="experience-title">${exp.position}</div>
              <div class="experience-company">${exp.company}</div>
            </div>
            <div class="experience-meta">
              <div>${exp.duration}</div>
              <div>${exp.location}</div>
            </div>
          </div>
          <div class="experience-description">
            <ul>
              ${exp.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $("main").append(experienceHTML);
}

function LoadProjects(data) {
  const projectsHTML = `
    <div class="section">
      <h2 class="section-title">${data.projects.title}</h2>
      <div class="projects-grid">
        ${data.projects.content.map(project => `
          <div class="project-card">
            <h3 class="project-title">
              <a href="${project.link}" target="_blank">${project.name}</a>
            </h3>
            <p class="project-description">${project.description}</p>
            <div class="project-technologies">
              ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  $("main").append(projectsHTML);
}

function LoadSkills(data) {
  const skillsHTML = `
    <div class="section">
      <h2 class="section-title">${data.skills.title}</h2>
      <div class="skills-grid">
        ${data.skills.content.map(skillset => `
          <div class="skill-category">
            <h3>${skillset.category}</h3>
            <div class="skill-items">
              ${skillset.items.map(item => `
                <div class="skill-item">
                  <img src="${item.iconUrl}" alt="${item.name}" width="16" height="16">
                  <span>${item.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  $("main").append(skillsHTML);
}

function LoadEducation(data) {
  const educationHTML = `
    <div class="section">
      <h2 class="section-title">${data.education.title}</h2>
      ${data.education.content.map(edu => `
        <div class="education-item">
          <img src="${edu.logo}" alt="education logo" class="education-logo">
          <div class="education-info">
            <h3>${edu.degree}</h3>
            <p class="institution">${edu.institution}</p>
          </div>
          <div class="education-meta">
            <div>${edu.location}</div>
            <div>${edu.year}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $("main").append(educationHTML);
}

function LoadLanguages(data) {
  const languagesHTML = `
    <div class="section">
      <h2 class="section-title">${data.languages.title}</h2>
      <div class="languages-list">
        ${data.languages.content.map(lang => `
          <div class="language-item">
            <span class="language-name">${lang.language}</span>
            <span class="language-level">${lang.proficiency}</span>
          </div>
        `).join('')}
      </div>
    </div>
      </div> <!-- Close cv-content -->
    </div> <!-- Close cv-container -->
  `;
  $("main").append(languagesHTML);
}

// Load Chinese text from separate file
async function loadChineseText() {
  try {
    const response = await fetch('js/langs/zh.json');
    const zhText = await response.json();
    
    // Add Chinese text to the texts array
    const chineseEntry = texts.find(t => t.lang === 'zh');
    if (chineseEntry) {
      chineseEntry.text = zhText;
    } else {
      texts.push({
        lang: 'zh',
        text: zhText
      });
    }
  } catch (error) {
    console.error('Failed to load Chinese text:', error);
  }
}

function LoadConfig(data) {
    loadContactInfo(data);
    LoadProfile(data);
    LoadWorkExperience(data);
    LoadProjects(data);
    LoadSkills(data);
    LoadEducation(data);
    LoadLanguages(data);
}

function switchLanguage(lang) {
  $("main").empty();
  const selectedText = texts.find((t) => t.lang === lang);
  if (selectedText) {
    LoadConfig(selectedText.text);
  }
}

// Language selector functionality
function setupLanguageSelector() {
  const languageBtn = document.getElementById('languageBtn');
  const languageDropdown = document.getElementById('languageDropdown');
  const languageOptions = document.querySelectorAll('.language-option');
  const langText = document.querySelector('.lang-text');
  
  if (!languageBtn) return;
  
  // Toggle dropdown
  languageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    languageBtn.classList.toggle('active');
    languageDropdown.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    languageBtn.classList.remove('active');
    languageDropdown.classList.remove('active');
  });
  
  // Handle language selection
  languageOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedLang = option.getAttribute('data-lang');
      const selectedText = option.querySelector('span:last-child').textContent;
      
      // Update button text
      langText.textContent = selectedLang.toUpperCase();
      
      // Switch language
      switchLanguage(selectedLang);
      
      // Close dropdown
      languageBtn.classList.remove('active');
      languageDropdown.classList.remove('active');
    });
  });
}

// Fallback for old language selector
function setupFallbackLanguageSelector() {
  const languageSelector = document.getElementById("languageSelector");
  if (languageSelector) {
    languageSelector.addEventListener("change", (e) => {
      const selectedLang = e.target.value;
      switchLanguage(selectedLang);
    });
  }
}

// Print functionality
function setupPrintButton() {
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Load the default language on page load
$(document).ready(async function () {
  await loadChineseText();
  setupLanguageSelector();
  setupFallbackLanguageSelector();
  setupPrintButton();
  switchLanguage("en");
});
