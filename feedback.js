$(document).ready(function () {
  let feedbackData = {
    Grade: null,
    Waiter: null,
    Food: false,
    Service: false,
    Atmosphere: false,
    Time: null,
  };

  // Global variable to store the countdown timer
  let countdownInterval = null;
  let animationInterval = null;

  // Click logo to reset the form and go back
  $(document).on("click", ".logo-container", function () {
    stopCountdownTimer();
    resetForm();
    showSection("rating-section");
    $(this).addClass("logo-clicked");
    setTimeout(function () {
      $(".section-logo").removeClass("logo-clicked");
    }, 300);
  });

  // Start the emoji animation when the page loads
  startEmojiAnimation();

  // Function to animate emojis with a fun bouncy motion from side to side
  function startEmojiAnimation() {
    const emojis = $(".emoji");
    let currentIndex = 0;

    // Clear any existing interval
    if (animationInterval) {
      clearInterval(animationInterval);
    }

    // Run the animation every 2 seconds (2000ms)
    animationInterval = setInterval(function () {
      if ($("#rating-section").hasClass("active")) {
        // Remove animation class from all emojis
        emojis.parent().removeClass("emoji-bounce");

        // Add animation to current emoji
        $(emojis[currentIndex]).parent().addClass("emoji-bounce");

        // Move to next emoji, loop back to start if needed
        currentIndex = (currentIndex + 1) % emojis.length;
      }
    }, 2000);
  }

  // Stop animation when leaving the rating section
  function stopEmojiAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
    $(".emoji").parent().removeClass("emoji-bounce");
  }

  // Function to load waiters from the API
  function loadWaiters() {
    const waiterContainer = $("#waiter-container");

    // Call the API to get waiters
    fetchWaiters()
      .then((waiters) => {
        // Clear the loading indicator
        waiterContainer.empty();

        // Create a flex container with proper spacing
        const waiterFlexContainer = $('<div class="waiter-container"></div>');
        waiterContainer.append(waiterFlexContainer);

        // Create waiter cards with simplified layout
        waiters.forEach((waiter) => {
          // Create a simpler waiter card with fixed dimensions
          const waiterCard = $(`
                        <div class="waiter-card" data-value="${waiter.id}">
                            <div class="waiter-img-container">
                                <img src="${waiter.image}" alt="${waiter.name}" class="waiter-img">
                            </div>
                            <div class="waiter-name">${waiter.name}</div>
                        </div>
                    `);

          // Add click event handler to the card
          waiterCard.click(function () {
            $(".waiter-card").removeClass("selected");
            $(this).addClass("selected");
            feedbackData.Waiter = parseInt($(this).data("value"));

            setTimeout(function () {
              // Only show aspects section for negative/neutral ratings
              if (feedbackData.Grade < 3) {
                showSection("aspects-section");
              } else {
                saveAndShowConfirmation();
              }
            }, 300);
          });

          // Add to the container
          waiterFlexContainer.append(waiterCard);
        });
      })
      .catch((error) => {
        console.error("Error loading waiters:", error);
        waiterContainer.html(`
                    <div class="alert alert-danger w-100 text-center">
                        Could not load waiters. Please try again later.
                    </div>
                `);
      });
  }

  // Load waiters when page loads
  loadWaiters();

  // Rating Selection
  $(document).on("click", ".rating-box", function () {
    $(".rating-box").removeClass("selected");
    $(this).addClass("selected");
    feedbackData.Grade = parseInt($(this).data("value"));

    setTimeout(function () {
      // If the unhappy emoji (Grade 1) was selected, skip straight to the aspects section
      if (feedbackData.Grade === 1) {
        feedbackData.Waiter = "Skipped";
        showSection("aspects-section");
      } else {
        // For neutral or happy emojis (Grade 2 or 3), proceed to waiter selection
        showSection("waiter-section");
      }
    }, 300);
  });

  // Skip Waiter Selection
  $("#skip-waiter").click(function () {
    feedbackData.Waiter = "Skipped";

    // Only show aspects section for negative/neutral ratings
    if (feedbackData.Grade < 3) {
      showSection("aspects-section");
    } else {
      saveAndShowConfirmation();
    }
  });

  // Improvement Selection
  $(".improvement-box").click(function () {
    // Toggle selection
    $(this).toggleClass("selected");

    // Update feedback data
    const category = $(this).data("category");
    feedbackData[category] = $(this).hasClass("selected");

    // Check if any improvement is selected
    const anySelected = $(".improvement-box.selected").length > 0;

    // Update button text based on selection
    if (anySelected) {
      $("#aspects-action-btn")
        .text("Fortsæt")
        .removeClass("btn-secondary")
        .addClass("btn-accent");
    } else {
      $("#aspects-action-btn")
        .text("Spring over")
        .removeClass("btn-accent")
        .addClass("btn-secondary");
    }
  });

  // Aspects Action Button
  $("#aspects-action-btn").click(function () {
    saveAndShowConfirmation();
  });

  // Helper Functions
  function showSection(sectionId) {
    // If we're leaving the rating section, stop the animation
    if (
      $("#rating-section").hasClass("active") &&
      sectionId !== "rating-section"
    ) {
      stopEmojiAnimation();
    }

    // If we're going to the rating section, start the animation
    if (sectionId === "rating-section") {
      startEmojiAnimation();
    }

    $(".section").removeClass("active");
    $("#" + sectionId).addClass("active");
  }
  function generatePersonalizedFeedback() {
    const waiterAcknowledgment = $("#waiter-acknowledgment");
    const improvementAcknowledgments = $("#improvement-acknowledgments");

    // Clear any existing messages
    waiterAcknowledgment.empty();
    improvementAcknowledgments.empty();

    // Add waiter acknowledgment if a waiter was selected
    if (feedbackData.Waiter && feedbackData.Waiter !== "Skipped") {
      // Get waiter name from the selected waiter card
      const waiterName = $(".waiter-card.selected .waiter-name").text();
      waiterAcknowledgment.html(
        `Vi giver <strong>${waiterName}</strong> besked om, at du satte pris på deres service.`
      );
    }

    // Add improvement acknowledgments if any were selected
    let improvementMessages = [];

    if (feedbackData.Food) {
      improvementMessages.push("maden");
    }

    if (feedbackData.Service) {
      improvementMessages.push("servicen");
    }

    if (feedbackData.Atmosphere) {
      improvementMessages.push("oplevelsen");
    }

    if (improvementMessages.length > 0) {
      let message = "";

      if (improvementMessages.length === 1) {
        message = `Tak for din feedback om ${improvementMessages[0]}. Vi vil arbejde på at forbedre dette.`;
      } else if (improvementMessages.length === 2) {
        message = `Tak for din feedback om ${improvementMessages[0]} og ${improvementMessages[1]}. Vi vil arbejde på at forbedre disse områder.`;
      } else {
        message = `Tak for din feedback om ${improvementMessages[0]}, ${improvementMessages[1]} og ${improvementMessages[2]}. Vi vil arbejde på at forbedre disse områder.`;
      }

      improvementAcknowledgments.html(`<p>${message}</p>`);
    }
  }
  function saveAndShowConfirmation() {
    feedbackData.Time = Math.floor(Date.now() / 1000); // Unix timestamp

    submitFeedback(feedbackData);
    generatePersonalizedFeedback();
    showSection("confirmation-section");
    startCountdownTimer();
  }

  function startCountdownTimer() {
    stopCountdownTimer();
    let timeLeft = 10;

    // Start the countdown
    countdownInterval = setInterval(function () {
      timeLeft--;

      if (timeLeft <= 0) {
        stopCountdownTimer();
        resetForm();
        showSection("rating-section");
      }
    }, 1000);
  }

  function stopCountdownTimer() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function resetForm() {
    // Reset selections
    $(".rating-box, .waiter-card, .improvement-box").removeClass("selected");

    // Reset action button
    $("#aspects-action-btn")
      .text("Spring over")
      .removeClass("btn-accent")
      .addClass("btn-secondary");

    // Reset feedback data
    feedbackData = {
      Grade: null,
      Waiter: null,
      Food: false,
      Service: false,
      Atmosphere: false,
      Time: null,
    };
  }
});
