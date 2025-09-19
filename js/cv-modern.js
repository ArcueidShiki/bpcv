// Global variable to track current language
let currentLanguage = "en";

const texts = [
  {
    "lang": "en",
    "text": {},
  },
  {
    "lang": "jp",
    "text": {},
  },
  {
    "lang": "zh",
    "text": {},
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

function LoadInternships(data) {
  if (!data.internships) return;

  const internshipsHTML = `
    <div class="section">
      <h2 class="section-title">${data.internships.title}</h2>
      ${data.internships.content.map(internship => `
        <div class="experience-item">
          <div class="experience-header">
            <img src="${internship.icon || 'icons/company/default.png'}" alt="company logo" class="company-logo">
            <div>
              <div class="experience-title">${internship.position}</div>
              <div class="experience-company">${internship.company}</div>
            </div>
            <div class="experience-meta">
              <div>${internship.duration}</div>
              <div>${internship.location}</div>
            </div>
          </div>
          <div class="experience-description">
            <ul>
              ${internship.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $("main").append(internshipsHTML);
}

function LoadHackathons(data) {
  if (!data.hackathons) return;

  const hackathonsHTML = `
    <div class="section">
      <h2 class="section-title">${data.hackathons.title}</h2>
      ${data.hackathons.content.map(hackathon => `
        <div class="hackathon-item">
          <div class="hackathon-header">
            <div class="hackathon-badge">🏆</div>
            <div>
              <div class="hackathon-event">${hackathon.event}</div>
              <div class="hackathon-position">${hackathon.position}</div>
              <div class="hackathon-project">${hackathon.project}</div>
            </div>
            <div class="hackathon-meta">
              <div>${hackathon.date}</div>
              <div>${hackathon.location}</div>
            </div>
          </div>
          <div class="hackathon-description">
            <ul>
              ${hackathon.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
            ${hackathon.links ? `
              <div class="hackathon-links">
                ${hackathon.links.github ? `<a href="${hackathon.links.github}" target="_blank" class="link-github">GitHub</a>` : ''}
                ${hackathon.links.linkedin ? `<a href="${hackathon.links.linkedin}" target="_blank" class="link-linkedin">LinkedIn</a>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $("main").append(hackathonsHTML);
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

// Load all language texts from separate files
async function loadAllLanguageTexts() {
  const languages = ['en', 'jp', 'zh'];

  for (const lang of languages) {
    try {
      const response = await fetch(`js/langs/${lang}.json`);
      const langText = await response.json();

      // Find and update the corresponding entry in texts array
      const langEntry = texts.find(t => t.lang === lang);
      if (langEntry) {
        langEntry.text = langText;
      } else {
        texts.push({
          lang: lang,
          text: langText
        });
      }
      console.log(`Successfully loaded ${lang} language data`);
    } catch (error) {
      console.error(`Failed to load ${lang} text:`, error);
    }
  }
}

function LoadConfig(data) {
  loadContactInfo(data);
  LoadProfile(data);
  LoadWorkExperience(data);
  LoadInternships(data);
  LoadHackathons(data);
  LoadProjects(data);
  LoadSkills(data);
  LoadEducation(data);
  LoadLanguages(data);

  // Add flowing border effect to all cards
  addFlowingBorderEffect();
}

function switchLanguage(lang) {
  currentLanguage = lang; // Update current language
  $("main").empty();
  const selectedText = texts.find((t) => t.lang === lang);
  if (selectedText) {
    LoadConfig(selectedText.text);
  }
}

// PDF button functionality
function setupPdfButton() {
  const pdfBtn = document.getElementById('pdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      let pdfPath;
      if (currentLanguage === 'zh') {
        pdfPath = 'resume/Resume_zh.pdf';
      } else {
        pdfPath = 'resume/Resume.pdf'; // Default to English for 'en' and 'jp'
      }
      window.location.href = pdfPath;
    });
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

// Load the default language on page load
$(document).ready(async function () {
  await loadAllLanguageTexts();
  setupLanguageSelector();
  setupFallbackLanguageSelector();
  setupPdfButton();
  switchLanguage("en");
});

// Add flowing border effect to cards
function addFlowingBorderEffect() {
  const cardSelectors = [
    '.experience-item',
    '.project-card',
    '.skill-category',
    '.education-item',
    '.hackathon-item',
    '.cv-container',
    '.map-section',
    '.chatbot-section'
  ];
}
