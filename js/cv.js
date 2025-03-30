// Default language
let currentLanguage = "en";

function loadContactInfo(data) {
  const contactInfo = data.contactInfo;

  // Dynamically generate the HTML for the contact information
  const contactHTML = `
      <div class="contact-card">
        <img class="profile-picture" src="${
          contactInfo.profilePicture
        }" width="100px" alt="${contactInfo.name}'s Profile Picture">
        <h2 class="name">${contactInfo.name}</h1>
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
                        <p class="profile">${data.profile.content}</p>`;
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
            <h3>${exp.position} - ${exp.company}</h3>
            <p>${exp.duration}</p>
            <p>${exp.location}</p>
            <img src="${exp.icon}" alt="company logo" width="50px">
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
                <img src="${edu.logo}" alt="edu logo" width="50px"> <span>${edu.institution}</span> <span>${edu.location}</span>
            </h3>
            <h3><span>${edu.degree}</span> <span>${edu.year}</span></h3>
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
                <ul>${skillset.items.map((item) =>
                    `<li><span>${item.name}</span><img src="${item.iconUrl}" alt="logo" width="20px"></li>`)
                    .join("")}
                </ul>
        </div>`)
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
                    <h3><a href="${project.link}" target="_blank">${project.name}</a></h3>
                    <p>${project.description}</p>
                    <ul>
                        ${project.technologies.map((tech) => `<li>${tech}</li>`).join("")}
                    </ul>
                </div>`).join("")}
    </div>`;
  $("main").append(projectsHTML);
}

function LoadLanguages(data) {
  const languagesHTML = `
  <h2> ${data.languages.title || "Languages"}</h2>
    <div class="languages">
        ${data.languages.content.map((lang) => `
            <li>${lang.language}:${lang.proficiency}</li>`
        ).join("")}
    </div>`;
  $("main").append(languagesHTML);
}

function LoadConfig(language) {
  const filePath = `js/langs/${language}.json`;

  // Fetch the JSON file
  $.getJSON(filePath, function (data) {
    loadContactInfo(data);
    LoadProfile(data);
    LoadWorkExperience(data);
    LoadEducation(data);
    LoadSkills(data);
    LoadProjects(data);
    LoadLanguages(data);
  });
}

// Load the default language on page load
$(document).ready(function () {
  LoadConfig(currentLanguage);
});
