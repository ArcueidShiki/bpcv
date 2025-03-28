console.log("THREE: ", THREE);
console.log("OrbitControls: ", THREE.OrbitControls);
console.log("dat: ", dat);
console.log("bootstrap: ", bootstrap);

// Example usage of THREE.js
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 5;

// function animate() {
//     requestAnimationFrame(animate);
//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;
//     renderer.render(scene, camera);
// }
// animate();

const practices = [
  {
    id: 1,
    category: "HTML",
    text: "Use semantic HTML",
    explanation: "Improves accessibility and SEO.",
  },
  {
    id: 2,
    category: "HTML",
    text: "Use alt attributes for images",
    explanation: "Improves accessibility for visually impaired users.",
  },
  {
    id: 3,
    category: "HTML",
    text: "Use proper heading hierarchy",
    explanation: "Helps with SEO and accessibility.",
  },
  {
    id: 4,
    category: "HTML",
    text: "Use meta tags",
    explanation: "Provides metadata about the HTML document.",
  },
  {
    id: 5,
    category: "HTML",
    text: "Use forms correctly",
    explanation: "Ensures proper data collection and submission.",
  },
  {
    id: 6,
    category: "CSS",
    text: "Use external stylesheets",
    explanation: "Keeps HTML clean and improves load times.",
  },
  {
    id: 7,
    category: "CSS",
    text: "Use responsive design",
    explanation: "Ensures the website looks good on all devices.",
  },
  {
    id: 8,
    category: "CSS",
    text: "Use CSS variables",
    explanation: "Makes it easier to manage and update styles.",
  },
  {
    id: 9,
    category: "CSS",
    text: "Use flexbox for layout",
    explanation:
      "Provides a more efficient way to layout, align, and distribute space.",
  },
  {
    id: 10,
    category: "CSS",
    text: "Use CSS Grid",
    explanation: "Provides a powerful layout system for complex designs.",
  },
  {
    id: 11,
    category: "JavaScript",
    text: "Use strict mode",
    explanation: "Helps catch common coding errors and 'unsafe' actions.",
  },
  {
    id: 12,
    category: "JavaScript",
    text: "Use event delegation",
    explanation:
      "Improves performance by reducing the number of event listeners.",
  },
  {
    id: 13,
    category: "JavaScript",
    text: "Use async/await",
    explanation: "Makes asynchronous code easier to read and write.",
  },
  {
    id: 14,
    category: "JavaScript",
    text: "Use closures",
    explanation: "Allows for data encapsulation and private variables.",
  },
  {
    id: 15,
    category: "JavaScript",
    text: "Use modules",
    explanation: "Helps organize code and manage dependencies.",
  },
];

function launchConfetti() {
  const duration = 5 * 1000; // 5 seconds
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

function addBalloons() {
  const container = $("#animal-picture");
  for (let i = 0; i < 10; i++) {
    const balloon = $('<div class="balloon"></div>');
    balloon.css({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
    });
    container.append(balloon);

    // Remove balloon after animation
    setTimeout(() => balloon.remove(), 5000);
  }
}

$(document).ready(function () {
  const practicesList = $("#practices-list");
  const categories = ["HTML", "CSS", "JavaScript"];
  categories.forEach((category) => {
    practicesList.append(`<h3 class="practice-category">${category}</h3>`);
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

    if (selectedPractices >= 12) {
      $.ajax({
        url: "https://api.thecatapi.com/v1/images/search",
        method: "GET",
        success: function (data) {
          if (data && data.length > 0) {
            const imgUrl = data[0].url;
            console.log("iamge:", imgUrl);
            $("#animal-picture").html(
              `<img src="${imgUrl}" alt="Cute Animal" width="30%">`
            );
            // Trigger confetti effect
            launchConfetti();

            // Add balloons
            addBalloons();
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
