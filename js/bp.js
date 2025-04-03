// console.log("THREE: ", THREE);
// console.log("OrbitControls: ", THREE.OrbitControls);
// console.log("dat: ", dat);
// console.log("bootstrap: ", bootstrap);

const practices = [
  {
    id: 1,
    category: "HTML",
    text: "Multimedia Fallback",
    explanation: "For multimedia, such as images, videos, animated objects via canvas, make sure to offer alternative access. For images that means use of meaningful alternative text (alt) and for video and audio transcripts and captions, if available(Google, n.d.).",
  },
  {
    id: 2,
    category: "HTML",
    text: "Semantics",
    explanation: "Use elements (sometimes incorrectly called “tags”) for what they have been created for. For example, use heading elements for headings, p elements for paragraphs, a elements for anchors, etc(Google, n.d.).",
  },
  {
    id: 3,
    category: "HTML",
    text: "type Attributes",
    explanation: "Omit type attributes for style sheets and scripts. Do not use type attributes for style sheets (unless not using CSS) and scripts (unless not using JavaScript)(Google, n.d.).",
  },
  {
    id: 4,
    category: "HTML",
    text: "id Attributes",
    explanation: "Avoid unnecessary id attributes. Prefer class attributes for styling and data attributes for scripting. Where id attributes are strictly required, always include a hyphen in the value to ensure it does not match the JavaScript identifier syntax, e.g. use user-profile rather than just profile or userProfile(Google, n.d.).",
  },
  {
    id: 5,
    category: "HTML",
    text: "Quotation Marks",
    explanation: "When quoting attributes values, use double quotation marks. Use double (\"\") rather than single quotation marks ('') around attribute values(Google, n.d.).",
  },
  {
    id: 6,
    category: "CSS",
    text: "Class Naming",
    explanation: "Use meaningful or generic class names. Instead of presentational or cryptic names, always use class names that reflect the purpose of the element in question, or that are otherwise generic(Google, n.d.).",
  },
  {
    id: 7,
    category: "CSS",
    text: "Class Name Delimiters",
    explanation: "Separate words in class names by a hyphen. Do not concatenate words and abbreviations in selectors by any characters (including none at all) other than hyphens, in order to improve understanding and scannability(Google, n.d.).",
  },
  {
    id: 8,
    category: "CSS",
    text: "Prefixes",
    explanation: "Prefix selectors with an application-specific prefix (optional). In large projects as well as for code that gets embedded in other projects or on external sites use prefixes (as namespaces) for class names. Use short, unique identifiers followed by a dash. Using namespaces helps preventing naming conflicts and can make maintenance easier, for example in search and replace operations(Google, n.d.).",
  },
  {
    id: 9,
    category: "CSS",
    text: "Type Selectors",
    explanation: "Avoid qualifying class names with type selectors. Unless necessary (for example with helper classes), do not use element names in conjunction with classes. Avoiding unnecessary ancestor selectors is useful for performance reasons(Google, n.d.).",
  },
  {
    id: 10,
    category: "CSS",
    text: "ID Selectors",
    explanation: "Avoid ID selectors. ID attributes are expected to be unique across an entire page, which is difficult to guarantee when a page contains many components worked on by many different engineers. Class selectors should be preferred in all situations(Google, n.d.).",
  },
  {
    id: 11,
    category: "JavaScript",
    text: "File name",
    explanation: "File names must be all lowercase and may include underscores (_) or dashes (-), but no additional punctuation. Follow the convention that your project uses. Filenames’ extension must be .js(Google, n.d.).",
  },
  {
    id: 12,
    category: "JavaScript",
    text: "Imports",
    explanation: "ES module files must use the import statement to import other ES module files. Do not goog.require another ES module. The .js file extension is not optional in import paths and must always be included(Google, n.d.).",
  },
  {
    id: 13,
    category: "JavaScript",
    text: "Exports",
    explanation: "Symbols are only exported if they are meant to be used outside the module. Non-exported module-local symbols are not declared @private. There is no prescribed ordering for exported and module-local symbols(Google, n.d.).",
  },
  {
    id: 14,
    category: "JavaScript",
    text: "Column limit: 80",
    explanation: "JavaScript code has a column limit of 80 characters. Except as noted below, any line that would exceed this limit must be line-wrapped(Google, n.d.).",
  },
  {
    id: 15,
    category: "JavaScript",
    text: "Naming",
    explanation: "Identifiers use only ASCII letters and digits, and, in a small number of cases noted below, underscores and very rarely (when required by frameworks like Angular) dollar signs(Google, n.d.).",
  },
  {
    id: 16,
    category: "HTML",
    text: "HTML Formatting Rules",
    explanation: "Use a new line for every block, list, or table element, and indent every such child element. Independent of the styling of an element (as CSS allows elements to assume a different role per display property), put every block, list, or table element on a new line. Also, indent them if they are child elements of a block, list, or table element(Google, n.d.).",
  },
  {
    id: 17,
    category: "CSS",
    text: "0 and Units",
    explanation: "Omit unit specification after “0” values, unless required. Do not use units after 0 values unless they are required(Google, n.d.).",
  },
  {
    id: 18,
    category: "JavaScript",
    text: "Nested functions and closures",
    explanation: "Functions may contain nested function definitions. If it is useful to give the function a name, it should be assigned to a local const(Google, n.d.).",
  }
];

const references = [
  {
    id: 1,
    author: "Google",
    title: "Google HTML/CSS Style Guide",
    url: "https://google.github.io/styleguide/htmlcssguide.html",
    date: "(n.d.)"
  },
  {
    id: 2,
    author: "Google",
    title: "Google JavaScript Style Guide",
    url: "https://google.github.io/styleguide/jsguide.html",
    date: "(n.d.)"
  },
  {
    id: 3,
    author: "XorDev",
    title: "Singularity [381]",
    url: "https://www.shadertoy.com/view/3csSWB",
    date: "(2025, March, 6)"
  },
  {
    id: 4,
    author: "OpenAI",
    title: "ChatGTP (Mar 14 version) [Large language model]",
    url: "https://chat.openai.com/chat",
    date: "(2023)"
  }
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
                <a href="${reference.url}" target="_blank">
                  ${reference.author}.${reference.date}.<i>${reference.title}</i>.${reference.url}
                </a>
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