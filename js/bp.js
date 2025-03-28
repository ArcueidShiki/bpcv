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
  },
  {
    id: 19,
    category: "CSS",
    text: "Use a CSS preprocessor like SASS or LESS",
    explanation: "Preprocessors add features like nesting, variables, and mixins, making your CSS more maintainable and easier to write.",
  },
  {
    id: 20,
    category: "JavaScript",
    text: "Use debouncing and throttling for event listeners",
    explanation: "These techniques help optimize performance by limiting the frequency of function execution during high-frequency events like scrolling or resizing.",
  },
];

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

$(document).ready(function () {
  const practicesList = $("#practices-list");
  const categories = ["HTML", "CSS", "JavaScript"];
  categories.forEach((category) => {
    practicesList.append(`<h3 id="${category}-section" class="practice-category">${category}</h3>`);
    practices
      .filter((practice) => practice.category === category)
      .forEach((practice) => {
        const practiceItem = $(`
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="practice-${practice.id}">
                    <label class="form-check-label" for="practice-${practice.id}">
                        ${practice.text} - ${practice.explanation}
                    </label>
                </div>
            `);
        practicesList.append(practiceItem);
      });
  });

  // Load selections from local storage
  practices.forEach((practice) => {
    const isChecked =
      localStorage.getItem(`practice-${practice.id}`) === "true";
    $(`#practice-${practice.id}`).prop("checked", isChecked);
  });

  $("input[type='checkbox']").change(function () {
    const id = $(this).attr("id");
    localStorage.setItem(id, $(this).is(":checked"));
    updateSummary();
  });

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

    if (selectedPractices >= practices.length * 0.8) {
      $.ajax({
        url: "https://api.thecatapi.com/v1/images/search",
        method: "GET",
        success: function (data) {
          if (data && data.length > 0) {
            const imgUrl = data[0].url;
            console.log("iamge:", imgUrl);
            $("#animal-picture").html(
              `<img id="animalImg" src="${imgUrl}" alt="Cute Animal">
              <img id="close-btn" src="icons/close.svg" alt="Close icon" />`
            );
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

  updateSummary();
});


$(document).ready(function () {
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
});


$(document).on("click", "#close-btn", function () {
  $("#animalImg").remove();
  $("#close-btn").remove();
});