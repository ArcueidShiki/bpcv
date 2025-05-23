const texts = [
  {
    "lang": "en",
    "text": {
      contactInfo: {
        name: "Jingtong (Jensen Arcueid) Peng",
        position: "Software Engineer",
        profilePicture: "icons/profile.jpg",
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
          "Results-driven software engineer with a strong background in C++ development, backend systems, and full-stack applications. ",
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
              "Developed and maintained debugging and performance tuning tools (Hiperf) for HarmonyOS using C++, Python, and Bash. ",
              "Enhanced crash analysis tools, implementing stack concatenation and Flame Graph visualization, reducing debugging time by 40%. ",
              "Designed automated testing scripts for CPU/memory performance evaluation, improving system efficiency. ",
              "Managed Git/Repo-based repositories in a large-scale development environment. ",
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
            description:
              "A US stock market paper trading web application",
            technologies: ["Flask", "Sqlalchemy", "Echarts", "bootstrap", "JWT"],
          },
          {
            name: "Hiperf",
            link: "https://gitee.com/openharmony/developtools_hiperf",
            description:
              "A HarmonyOs System Performance Debugging Tool.",
            technologies: ["C/C++", "LinuxPerf", "AOSP", "Python", "ADB"],
          },
          {
            name: "Remote Control",
            link: "https://github.com/ArcueidShiki/RemoteControl",
            description:
              "A Windows Remote Control Application, Screen watch, keyboard and Mouse control.",
            technologies: ["C/C++", "TCP/IP", "MFC", "IOCP", "QT"],
          },
          {
            name: "Penni",
            link: "https://github.com/codersforcauses/penni",
            description:
              "A mobile application that helps retirees find part-time jobs.",
            technologies: ["React", "Nextjs", "TailwindCss", "NPM"],
          },
          {
            name: "IOT Smart Entry System",
            link: "https://github.com/ArcueidShiki/SmartEntrySystem",
            description:
              "A IOT based face recognition system for entry control.",
            technologies: ["RaspberryPi", "OpenCV", "Flask", "MQTT", "Tensorflow"],
          },
          {
            name: "Best Agile Practice & CV",
            link: "https://github.com/ArcueidShiki/bpcv",
            description:
              "An uni individual project that helps students to build their CV.",
            technologies: ["HTML", "CSS", "JavaScript", "jQuery", "WebGL", "OpenGL Shader"],
          },
          {
            name: "Portfolio",
            link: "https://www.arcueidshiki.uk/",
            description:
              "A personal portfolio website showcasing my projects and skills.",
            technologies: ["Threejs", "Vite", "Blender"],
          },
          {
            name: "MFC VLC Player",
            link: "https://github.com/ArcueidShiki/VideoPlay",
            description:
              "A VLC player based on MFC, supporting multiple video formats.",
            technologies: ["VLC", "MFC", "C++"],
          },
          {
            name: "Interpreter",
            link: "https://github.com/ArcueidShiki/interpreter",
            description:
              "An interpreter for a custom programming language, supporting basic arithmetic and control flow.",
            technologies: ["C"],
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
              {
                name: "JavaScript",
                iconUrl: "https://skillicons.dev/icons?i=js",
              },
              { name: "Python", iconUrl: "https://skillicons.dev/icons?i=py" },
              { name: "Java", iconUrl: "https://skillicons.dev/icons?i=java" },
              {
                name: "TypeScript",
                iconUrl: "https://skillicons.dev/icons?i=ts",
              },
            ],
          },
          {
            category: "Backend Development",
            items: [
              {
                name: "Linux Server",
                iconUrl: "https://skillicons.dev/icons?i=linux",
              },
              {
                name: "Windows IOCP",
                iconUrl: "https://skillicons.dev/icons?i=windows",
              },
              {
                name: "Redis",
                iconUrl: "https://skillicons.dev/icons?i=redis",
              },
              {
                name: "SpringBoot",
                iconUrl: "https://skillicons.dev/icons?i=spring",
              },
              {
                name: "Flask",
                iconUrl: "https://skillicons.dev/icons?i=flask",
              },
            ],
          },
          {
            category: "Frontend Development",
            items: [
              {
                name: "Three.js",
                iconUrl: "https://skillicons.dev/icons?i=threejs",
              },
              {
                name: "React",
                iconUrl: "https://skillicons.dev/icons?i=react",
              },
              {
                name: "Next.js",
                iconUrl: "https://skillicons.dev/icons?i=nextjs",
              },
              {
                name: "Vue.js",
                iconUrl: "https://skillicons.dev/icons?i=vuejs",
              },
              { name: "HTML", iconUrl: "https://skillicons.dev/icons?i=html" },
              { name: "CSS", iconUrl: "https://skillicons.dev/icons?i=css" },
              {
                name: "Bootstrap",
                iconUrl: "https://skillicons.dev/icons?i=bootstrap",
              },
              { name: "QT", iconUrl: "https://skillicons.dev/icons?i=qt" },
              {
                name: "Flutter",
                iconUrl: "https://skillicons.dev/icons?i=tailwindcss",
              },
            ],
          },
          {
            category: "Database",
            items: [
              {
                name: "MySQL",
                iconUrl: "https://skillicons.dev/icons?i=mysql",
              },
              {
                name: "Sqlite",
                iconUrl: "https://skillicons.dev/icons?i=sqlite",
              },
              {
                name: "MongoDB",
                iconUrl: "https://skillicons.dev/icons?i=mongodb",
              },
            ],
          },
          {
            category: "DevOps",
            items: [
              { name: "Git", iconUrl: "https://skillicons.dev/icons?i=git" },
              {
                name: "Docker",
                iconUrl: "https://skillicons.dev/icons?i=docker",
              },
              { name: "AWS", iconUrl: "https://skillicons.dev/icons?i=aws" },
              {
                name: "Cloudflare",
                iconUrl: "https://skillicons.dev/icons?i=cloudflare",
              },
            ],
          },
          {
            category: "Embedded Systems",
            items: [
              {
                name: "Arduino",
                iconUrl: "https://skillicons.dev/icons?i=arduino",
              },
              {
                name: "Raspberry Pi",
                iconUrl: "https://skillicons.dev/icons?i=raspberrypi",
              },
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
          {
            language: "English",
            proficiency: "Fluent",
          },
          {
            language: "Chinese",
            proficiency: "Native",
          },
          {
            language: "Japanese",
            proficiency: "Basic",
          },
        ],
      },
    },
  },
  {
    "lang": "jp",
    "text": {
      contactInfo: {
        name: "ペン・ジントン (ジェンセン・アルクエイド)",
        position: "ソフトウェアエンジニア",
        profilePicture: "icons/profile.jpg",
        websites: [
          { name: "ポートフォリオ", url: "https://www.arcueidshiki.uk/" },
          {
            name: "ベストアジャイルプラクティス＆履歴書",
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
          "C++開発、バックエンドシステム、フルスタックアプリケーションに強いソフトウェアエンジニア。",
          "Huaweiで1.5年以上の経験を持ち、パフォーマンス最適化、デバッグツール、システムアーキテクチャを専門としています。",
          "現在、UWAで情報技術の修士課程を追求しており、オーストラリアでのソフトウェアエンジニアリングの役割を探しています。",
        ],
      },
      workexperience: {
        title: "職務経験",
        content: [
          {
            position: "端末ソフトウェアエンジニア",
            company: "Huawei Technologies Co., Ltd.",
            icon: "icons/company/huawei.png",
            duration: "2022年9月 - 2024年2月",
            location: "中国 北京",
            description: [
              "C++、Python、Bashを使用してHarmonyOSのデバッグおよびパフォーマンス調整ツール（Hiperf）を開発および維持。",
              "クラッシュ分析ツールを強化し、スタックの連結とフレームグラフの視覚化を実装し、デバッグ時間を40％短縮。",
              "CPU/メモリパフォーマンス評価のための自動テストスクリプトを設計し、システム効率を向上。",
              "大規模な開発環境でGit/Repoベースのリポジトリを管理。",
            ],
          },
          {
            position: "フルスタック開発者",
            company: "Bytedance",
            icon: "icons/company/bytedance.png",
            duration: "2021年2月 - 2022年4月",
            location: "中国 重慶",
            description: [
              "Java、Spring Boot、および関連するバックエンド技術を使用して病院向けのWebアプリケーションを開発および維持し、安全で効率的な医療データ管理を確保。",
              "UI/UXデザイナー、プロダクトマネージャー、他の開発者などのクロスファンクショナルチームと協力して、高品質でスケーラブルな病院管理システムを構築。",
              "レスポンシブでユーザーフレンドリーなデザインを実装し、クロスブラウザ互換性と医療データベースとのシームレスな統合を確保。",
              "コードレビューに参加し、バックエンドパフォーマンスを最適化し、全体的なソフトウェア品質を向上させるために建設的なフィードバックを提供。",
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
            technologies: [
              "Flask",
              "Sqlalchemy",
              "Echarts",
              "bootstrap",
              "JWT",
            ],
          },
          {
            name: "Hiperf",
            link: "https://gitee.com/openharmony/developtools_hiperf",
            description: "HarmonyOsシステムパフォーマンスデバッグツール。",
            technologies: ["C/C++", "LinuxPerf", "AOSP", "Python", "ADB"],
          },
          {
            name: "リモートコントロール",
            link: "https://github.com/ArcueidShiki/RemoteControl",
            description: "Windowsリモートコントロールアプリケーション、画面監視、キーボードとマウスの制御。",
            technologies: ["C/C++", "TCP/IP", "MFC", "IOCP", "QT"],
          },
          {
            name: "ペンニ",
            link: "https://github.com/codersforcauses/penni",
            description: "退職者がパートタイムの仕事を見つけるのを助けるモバイルアプリケーション。",
            technologies: ["React", "Nextjs", "TailwindCss", "NPM"],
          },
          {
            name: "IOTスマートエントリーシステム",
            link: "https://github.com/ArcueidShiki/SmartEntrySystem",
            description: "エントリー制御のためのIOTベースの顔認識システム。",
            technologies: [
              "RaspberryPi",
              "OpenCV",
              "Flask",
              "MQTT",
              "Tensorflow",
            ],
          },
          {
            name: "ベストアジャイルプラクティス＆履歴書",
            link: "https://github.com/ArcueidShiki/bpcv",
            description: "学生が履歴書を作成するのを支援する大学の個人プロジェクト。",
            technologies: [
              "HTML",
              "CSS",
              "JavaScript",
              "jQuery",
              "WebGL",
              "OpenGL Shader",
            ],
          },
          {
            name: "ポートフォリオ",
            link: "https://www.arcueidshiki.uk/",
            description:
              "私のプロジェクトとスキルを紹介する個人ポートフォリオWebサイト。",
            technologies: ["Threejs", "Vite", "Blender"],
          },
          {
            name: "MFC VLCプレーヤー",
            link: "https://github.com/ArcueidShiki/VideoPlay",
            description: "複数のビデオ形式をサポートするMFCベースのVLCプレーヤー。",
            technologies: ["VLC", "MFC", "C++"],
          },
          {
            name: "インタープリター",
            link: "https://github.com/ArcueidShiki/interpreter",
            description:
              "基本的な算術演算と制御フローをサポートするカスタムプログラミング言語のインタープリター。",
            technologies: ["C"],
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
              {
                name: "JavaScript",
                iconUrl: "https://skillicons.dev/icons?i=js",
              },
              { name: "Python", iconUrl: "https://skillicons.dev/icons?i=py" },
              { name: "Java", iconUrl: "https://skillicons.dev/icons?i=java" },
              {
                name: "TypeScript",
                iconUrl: "https://skillicons.dev/icons?i=ts",
              },
            ],
          },
          {
            category: "Backend Development",
            items: [
              {
                name: "Linux Server",
                iconUrl: "https://skillicons.dev/icons?i=linux",
              },
              {
                name: "Windows IOCP",
                iconUrl: "https://skillicons.dev/icons?i=windows",
              },
              {
                name: "Redis",
                iconUrl: "https://skillicons.dev/icons?i=redis",
              },
              {
                name: "SpringBoot",
                iconUrl: "https://skillicons.dev/icons?i=spring",
              },
              {
                name: "Flask",
                iconUrl: "https://skillicons.dev/icons?i=flask",
              },
            ],
          },
          {
            category: "Frontend Development",
            items: [
              {
                name: "Three.js",
                iconUrl: "https://skillicons.dev/icons?i=threejs",
              },
              {
                name: "React",
                iconUrl: "https://skillicons.dev/icons?i=react",
              },
              {
                name: "Next.js",
                iconUrl: "https://skillicons.dev/icons?i=nextjs",
              },
              {
                name: "Vue.js",
                iconUrl: "https://skillicons.dev/icons?i=vuejs",
              },
              { name: "HTML", iconUrl: "https://skillicons.dev/icons?i=html" },
              { name: "CSS", iconUrl: "https://skillicons.dev/icons?i=css" },
              {
                name: "Bootstrap",
                iconUrl: "https://skillicons.dev/icons?i=bootstrap",
              },
              { name: "QT", iconUrl: "https://skillicons.dev/icons?i=qt" },
              {
                name: "Flutter",
                iconUrl: "https://skillicons.dev/icons?i=tailwindcss",
              },
            ],
          },
          {
            category: "Database",
            items: [
              {
                name: "MySQL",
                iconUrl: "https://skillicons.dev/icons?i=mysql",
              },
              {
                name: "Sqlite",
                iconUrl: "https://skillicons.dev/icons?i=sqlite",
              },
              {
                name: "MongoDB",
                iconUrl: "https://skillicons.dev/icons?i=mongodb",
              },
            ],
          },
          {
            category: "DevOps",
            items: [
              { name: "Git", iconUrl: "https://skillicons.dev/icons?i=git" },
              {
                name: "Docker",
                iconUrl: "https://skillicons.dev/icons?i=docker",
              },
              { name: "AWS", iconUrl: "https://skillicons.dev/icons?i=aws" },
              {
                name: "Cloudflare",
                iconUrl: "https://skillicons.dev/icons?i=cloudflare",
              },
            ],
          },
          {
            category: "Embedded Systems",
            items: [
              {
                name: "Arduino",
                iconUrl: "https://skillicons.dev/icons?i=arduino",
              },
              {
                name: "Raspberry Pi",
                iconUrl: "https://skillicons.dev/icons?i=raspberrypi",
              },
            ],
          },
        ],
      },
      education: {
        title: "学歴",
        content: [
          {
            degree: "情報技術修士課程",
            institution: "西オーストラリア大学",
            logo: "icons/edu/uwa.png",
            location: "オーストラリア パース",
            year: "2024年2月 - 2025年12月",
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
            year: "2015年9月 - 2019年7月",
          },
        ],
      },
      languages: {
        title: "言語",
        content: [
          {
            language: "英語",
            proficiency: "流暢",
          },
          {
            language: "中国語",
            proficiency: "母国語",
          },
          {
            language: "日本語",
            proficiency: "基礎",
          }
        ]
      },
    },
  },
];

// Default language
let currentLanguage = "en";

function loadContactInfo(data) {
  const contactInfo = data.contactInfo;

  // Dynamically generate the HTML for the contact information
  const contactHTML = `
      <div class="contact">
        <img class="profile-picture" src="${
          contactInfo.profilePicture
        }" width="100px" alt="${contactInfo.name}'s Profile Picture">
        <h2 class="name">${contactInfo.name}</h1>
        <br>
        <h2 class="position">${contactInfo.position}</h2>
        <div class="contact-details">
          <p><strong>Phone:</strong> ${contactInfo.phone
            .map((phone) => `<a href="tel:${phone}">${phone}</a>`)
            .join(", ")}</p>
          <p><strong>Email:</strong> ${contactInfo.email
            .map((email) => `<a href="mailto:${email}">${email}</a>`)
            .join(", ")}</p>
          <div class="websites">
            <strong>Websites:</strong>
              ${contactInfo.websites
                .map(
                  (site) =>
                    `<a href="${site.url}" target="_blank">${site.name}</a>`
                )
                .join("")}
          </div>
          <div class="social-links">
            <strong>Social Links:</strong>
              ${contactInfo.socialLinks
                .map(
                  (link) =>
                    `<a href="${link.url}" target="_blank"><img src="${link.icon}" alt="social img logo" width="20px"></a>`
                )
                .join("")}
          </div>
        </div>
      </div>
    `;
  $("main").append(contactHTML);
}

function LoadProfile(data) {
  const profileHTML = `<h2> ${data.profile.title || "Profile"}</h2><hr/>
                        <div>
                        <p class="profile">${data.profile.content}</p>
                        </div>`;
  $("main").append(profileHTML);
}

function LoadWorkExperience(data) {
  const title = ``;

  const experienceHTML = `
    <h2> ${data.workexperience.title || "Work Experience"}</h2><hr/>
    <div class="experiences">
    ${data.workexperience.content
      .map(
        (exp) => `
          <div class="experience">
            <img src="${exp.icon}" alt="company logo" width="50px"><h3> ${exp.company}</h3>
            <p>${exp.location}</p>
            <h4>${exp.position}</h4>
            <p>${exp.duration}</p>
            <p>${exp.description}</p>
          </div>
        `
      )
      .join("")}
      </div>`;
  $("main").append(experienceHTML);
}

function LoadEducation(data) {
  const educationHTML = `
  <h2> ${data.education.title || "Education"}</h2><hr/>
  <div class="educations">
  ${data.education.content
    .map(
      (edu) => `
          <div class="education">
            <h3>
                <img src="${edu.logo}" alt="edu logo" width="50px">
                <span class="edu-institution">${edu.institution}</span>
            </h3>
            <div class="edu-details">
                <p class="edu-location">${edu.location}</p>
                <p class="edu-degree">${edu.degree}</p>
                <p class="edu-year">${edu.year}</p>
             </div>
          </div>
        `
    )
    .join("")}
    </div>`;
  $("main").append(educationHTML);
}

function LoadSkills(data) {
  const skillsHTML = `
  <h2> ${data.skills.title || "Skills"}</h2><hr/>
  <div class="skills">
    ${data.skills.content
      .map(
        (skillset) => `
        <div class="skillset">
                <strong>${skillset.category}</strong>
                <br>
                ${skillset.items
                  .map(
                    (item) =>
                      `<button><span>${item.name}</span><img src="${item.iconUrl}" alt="logo" width="20px"></button>`
                  )
                  .join("")}
        </div>`
      )
      .join("")}
    </div>`;
  $("main").append(skillsHTML);
}

function LoadProjects(data) {
  const projectsHTML = `
  <h2> ${data.projects.title || "Projects"}</h2><hr/>
    <div class="projects">
        ${data.projects.content
          .map(
            (project) => `
                <div class="project">
                    <h3><a href="${project.link}" target="_blank">${
              project.name
            }</a></h3>
                    <p>${project.description}</p>
                        ${project.technologies
                          .map((tech) => `<button>${tech}</button>`)
                          .join("")}
                </div>`
          )
          .join("")}
    </div>`;
  $("main").append(projectsHTML);
}

function LoadLanguages(data) {
  const languagesHTML = `
  <h2> ${data.languages.title || "Languages"}</h2>
    <div class="languages">
        ${data.languages.content
          .map(
            (lang) => `
            <span>${lang.language}:${lang.proficiency}</span>`
          )
          .join("")}
    </div>`;
  $("main").append(languagesHTML);
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

document.getElementById("languageSelector").addEventListener("change", (e) => {
  const selectedLang = e.target.value;
  switchLanguage(selectedLang);
});


// Load the default language on page load
$(document).ready(function () {
  switchLanguage("jp");
  // LoadConfig(texts[0].text);
});
