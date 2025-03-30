// Default language
let currentLanguage = "en";

function LoadConfig(language) {
  const filePath = `js/langs/${language}.json`;

  // Fetch the JSON file
  $.getJSON(filePath, function (data) {
    console.log(`Loaded file: ${filePath}`);
    console.log(data);

    const contactInfo = data.contactInfo;

    // Dynamically generate the HTML for the contact information
    const contactHTML = `
      <div class="contact-card">
        <img class="profile-picture" src="${contactInfo.profilePicture}" width="100px" alt="${contactInfo.name}'s Profile Picture">
        <h1 class="name">${contactInfo.name}</h1>
        <h2 class="position">${contactInfo.position}</h2>
        <div class="contact-details">
          <p><strong>Phone:</strong> ${contactInfo.phone.map(phone => `<a href="tel:${phone}">${phone}</a>`).join(", ")}</p>
          <p><strong>Email:</strong> ${contactInfo.email.map(email => `<a href="mailto:${email}">${email}</a>`).join(", ")}</p>
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
    $("#basic-info").html(contactHTML);

    // Dynamically generate the HTML for the summary
    if (data.profile)
    {
        const title = `<h2> ${data.profile.title || "Profile"}</h2>`;
        const profileHTML = `<p>${data.profile.content}</p>`;
        $("#profile").html(title);
        $("#profile").html(profileHTML);
    }


    if (data.education) {
        const title = `<h2> ${data.education.title || "Education"}</h2>`;
      const educationHTML = data.education.content
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
        .join("");
      $("#education").html(title);
      $("#education").html(educationHTML);
    }

    if (data.workexperience) {
        const title = `<h2> ${data.workexperience.title || "Work Experience"}</h2>`;

      const experienceHTML = data.workexperience.content
        .map(
          (exp) => `
          <div class="experience-item">
            <h3>${exp.position} - ${exp.company}</h3>
            <p>${exp.duration}</p>
            <p>${exp.location}</p>
            <img src="${exp.icon}" alt="company logo" width="50px">
            <p>${exp.description}</p>
          </div>
        `
        )
        .join("");
      $("#work-experience").html(title);
      $("#work-experience").html(experienceHTML);
    }

    if (data.skills) {
        const title = `<h2> ${data.skills.title || "Skills"}</h2>`;
      const skillsHTML = data.skills.content
        .map((skillset) => `<strong>${skillset.category}</strong>
            <ul>${skillset.items.map((item) => `<li><span>${item.name}</span><img src="${item.iconUrl} alt="logo" width="20px" "></li>`).join("")}</ul>
        `)
        .join("");
      $("#skills").html(title);
      $("#skills").html(`<ul>${skillsHTML}</ul>`);
    }

    if (data.projects) {
        const title = `<h2> ${data.projects.title || "Projects"}</h2>`;
      const projectsHTML = data.projects.content
        .map(
          (project) => `
          <div class="project-item">
            <h3><a href="${project.link}" target="_blank">${project.name}</a></h3>
            <p>${project.description}</p>
            <ul>${project.technologies.map((tech) => `<li>${tech}</li>`).join("")}</ul>
          </div>
        `
        )
        .join("");
      $("#projects").html(title);
      $("#projects").html(projectsHTML);
    }

    if (data.languages) {
        const title = `<h2> ${data.languages.title || "Languages"}</h2>`;
      const languagesHTML = data.languages.content
        .map((lang) => `<li>${lang.language}:${lang.proficiency}</li>`)
        .join("");
      $("#languages").html(title);
      $("#languages").html(`<ul>${languagesHTML}</ul>`);
    }
  });
}

// Load the default language on page load
$(document).ready(function () {
  LoadConfig(currentLanguage);
});