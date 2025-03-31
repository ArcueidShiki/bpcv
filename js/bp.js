// console.log("THREE: ", THREE);
// console.log("OrbitControls: ", THREE.OrbitControls);
// console.log("dat: ", dat);
// console.log("bootstrap: ", bootstrap);

const practices = [
  {
    id: 1,
    category: "HTML",
    text: "Use semantic HTML to structure your content meaningfully",
    explanation: "Semantic HTML elements like header, footer, and article improve accessibility, SEO, and make your code easier to read and maintain.",
  },
  {
    id: 2,
    category: "HTML",
    text: "Always include alt attributes for images",
    explanation: "Alt attributes provide alternative text for images, improving accessibility for visually impaired users and ensuring content is understandable even if images fail to load.",
  },
  {
    id: 3,
    category: "HTML",
    text: "Maintain a proper heading hierarchy in your document",
    explanation: "Using headings like h1, h2, and h3 in a logical order helps screen readers and search engines understand the structure of your content.",
  },
  {
    id: 4,
    category: "HTML",
    text: "Include meta tags for better SEO and browser compatibility",
    explanation: "Meta tags like meta charset='UTF-8' and meta name='viewport' ensure your website is optimized for search engines and responsive on all devices.",
  },
  {
    id: 5,
    category: "HTML",
    text: "Use forms correctly with proper labels and input types",
    explanation: "Adding labels to form inputs improves accessibility, while using appropriate input types like 'email' or 'number' ensures better user experience and validation.",
  },
  {
    id: 6,
    category: "CSS",
    text: "Organize your styles using external stylesheets",
    explanation: "External stylesheets keep your HTML clean, improve maintainability, and allow for better caching, which speeds up page load times.",
  },
  {
    id: 7,
    category: "CSS",
    text: "Implement responsive design using media queries",
    explanation: "Media queries allow your website to adapt to different screen sizes, ensuring a consistent user experience across devices like phones, tablets, and desktops.",
  },
  {
    id: 8,
    category: "CSS",
    text: "Leverage CSS variables for consistent theming",
    explanation: "CSS variables (custom properties) make it easier to manage and update styles globally, especially for colors, fonts, and spacing.",
  },
  {
    id: 9,
    category: "CSS",
    text: "Use flexbox for creating flexible and responsive layouts",
    explanation: "Flexbox simplifies the process of aligning and distributing space among items in a container, even when their sizes are dynamic or unknown.",
  },
  {
    id: 10,
    category: "CSS",
    text: "Adopt CSS Grid for complex and two-dimensional layouts",
    explanation: "CSS Grid provides a powerful layout system that allows you to create intricate designs with rows and columns, making your layouts more robust and easier to maintain.",
  },
  {
    id: 11,
    category: "JavaScript",
    text: "Enable strict mode in your JavaScript code",
    explanation: "Strict mode helps you catch common coding errors, prevents the use of unsafe actions, and ensures better performance by enabling optimizations in JavaScript engines.",
  },
  {
    id: 12,
    category: "JavaScript",
    text: "Use event delegation for better performance",
    explanation: "Instead of adding event listeners to multiple child elements, attach a single listener to a parent element to handle events more efficiently.",
  },
  {
    id: 13,
    category: "JavaScript",
    text: "Write asynchronous code using async/await",
    explanation: "Async/await syntax makes asynchronous code easier to read and debug, avoiding the complexity of nested callbacks or promise chains.",
  },
  {
    id: 14,
    category: "JavaScript",
    text: "Understand and use closures effectively",
    explanation: "Closures allow you to create private variables and functions, enabling better data encapsulation and modular code.",
  },
  {
    id: 15,
    category: "JavaScript",
    text: "Organize your code using ES6 modules",
    explanation: "Modules help you split your code into reusable pieces, making it easier to manage dependencies and maintain your application.",
  },
  {
    id: 16,
    category: "HTML",
    text: "Use ARIA roles to enhance accessibility",
    explanation: "ARIA roles provide additional context to assistive technologies, ensuring that your website is usable by people with disabilities.",
  },
  {
    id: 17,
    category: "CSS",
    text: "Optimize animations and transitions for performance",
    explanation: "Use hardware-accelerated properties like transform and opacity to ensure smooth animations without affecting performance.",
  },
  {
    id: 18,
    category: "JavaScript",
    text: "Avoid polluting the global namespace",
    explanation: "Use IIFEs (Immediately Invoked Function Expressions) or modules to encapsulate your code and prevent conflicts with other scripts.",
  }
];

const references = [
  "https://getbootstrap.com/docs/5.3/getting-started/introduction/",
  "https://www.w3schools.com/",
  "https://developer.mozilla.org/en-US/",
  "https://google.github.io/styleguide/htmlcssguide.html",
  "https://google.github.io/styleguide/jsguide.html",
  "https://www.shadertoy.com/view/3csSWB",
  "github copilot assist with debugging"
]

function launchConfetti() {
  const duration = 300; // 0.5 seconds
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function LoadPractices() {
  const practicesList = $("#practices-list");
  const categories = ["HTML", "CSS", "JavaScript"];
  categories.forEach((category) => {
    let iconUrl;
    switch (category) {
      case "HTML": iconUrl = "icons/html.svg"; break;
      case "CSS": iconUrl = "icons/css.svg"; break;
      case "JavaScript": iconUrl = "icons/js.svg"; break;
    }
    practicesList.append(`<img id="${category}-section" class="practice-category" src="${iconUrl}" width="5%" alt="html icon" ">`);
    const categoryItem = $('<div class="category"></div>');
    practicesList.append(categoryItem);
    practices
      .filter((practice) => practice.category === category)
      .forEach((practice) => {
        const practiceItem = $(`
                <div id="practice-${practice.id}" class="check-card">
                    <h5 class="practice-title">${practice.text}</h5>
                    <br>
                    <p class="explanation" for="practice-${practice.id}">
                        ${practice.explanation}
                    </p>
                    <input class="check-input" type="checkbox" id="check-${practice.id}">
                </div>
            `);
        categoryItem.append(practiceItem);
      });
  });
}

function updateSummary() {
  const selectedPractices = $("input[type='checkbox']:checked").length;
  const totalPractices = practices.length;
  const percentage = Math.round((selectedPractices / totalPractices) * 100);

  $("#summary-text").text(
    `You have selected ${selectedPractices} out of ${practices.length} best practices.`
  );
  $(".progress-bar")
    .css("width", `${percentage}%`)
    .attr("aria-valuenow", percentage);
  $(".progress-bar").text(`${percentage}%`);

  if (selectedPractices >= 14) {
    $.ajax({
      url: "https://api.thecatapi.com/v1/images/search",
      method: "GET",
      success: function (data) {
        if (data && data.length > 0) {
          const imgUrl = data[0].url;
          // console.log("iamge:", imgUrl);
          $("#animal-picture").html(
            `<img id="animalImg" src="${imgUrl}" alt="Cute Animal">
             <img id="close-btn" src="icons/close.svg" alt="Close icon" />`
          );
          $("#animal-picture").css("z-index", "100");
          $("#animalImg").css("z-index", "101");
          $("#close-btn").css("z-index", "102");
          launchConfetti();
        } else {
          console.error("No image found");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error fetching image:", error);
      },
    });
  } else {
    $("#animal-picture").empty();
  }
}

function ToggleSidebar() {
  const sidebar = $("#sidebar");
  const toggleButton = $("#toggle-sidebar-btn");
  const arrowImage = $("#arrow");

  toggleButton.on("click", function () {
    const isToggled = sidebar.hasClass("toggle");

    if (isToggled) {
      sidebar.toggleClass("toggle");
      arrowImage.toggleClass("toggle");
      arrowImage.css("transform", "rotate(180deg)");
    } else {
      sidebar.toggleClass("toggle");
      arrowImage.toggleClass("toggle");
      arrowImage.css("transform", "rotate(0deg)");
    }
  });
}

function LoadLocalStorage() {
    // Load selections from local storage
    practices.forEach((practice) => {
      const isChecked =
        localStorage.getItem(`check-${practice.id}`) === "true";
      $(`#check-${practice.id}`).prop("checked", isChecked);
      $(`#practice-${practice.id}`).toggleClass("selected", isChecked);
    });
}

function LoadReferences()
{
  const referencesList = $("#ref-section");
  references.forEach((reference) => {
    const referenceItem = $(`
            <li class="reference-item">
                <a href="${reference}" target="_blank">${reference}</a>
            </li>
        `);
    referencesList.append(referenceItem);
  });
}

$(document).ready(function () {
  LoadPractices();
  LoadLocalStorage();
  updateSummary();
  LoadReferences();
  ToggleSidebar();
});

$(document).on("click", ".check-card", function (e) {
  if ($(e.target).is(".check-input")) return;

  const checkbox = $(this).find(".check-input");
  checkbox.prop("checked", !checkbox.prop("checked"));
  checkbox.checked = checkbox.prop("checked");
  $(this).toggleClass("selected", checkbox.prop("checked"));
  const id = checkbox.attr("id");
  localStorage.setItem(id, checkbox.prop("checked"));
  updateSummary();
});

$(document).on("click", "#close-btn", function () {
  $("#animalImg").remove();
  $("#close-btn").remove();
  $("#animal-picture").css("z-index", "0");
});