function submitFeedback(feedbackData) {
  return new Promise((resolve, reject) => {
    try {
      const submission = {
        ...feedbackData,
        submittedAt: new Date().toISOString(),
      };
      // replace with API call to save feedback
      saveFile(submission);
      /*
            fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submission)
            });
            */

      resolve({
        success: true,
        message: "Feedback saved successfully",
      });
    } catch (error) {
      console.error("Error saving feedback:", error);
      reject({
        success: false,
        message: error.message,
      });
    }
  });
}
/**
 * API version of fetchWaiters
 */
/*
function fetchWaiters() {
  return fetch('https://youku.dk/waiters')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load waiter data from API');
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error loading waiter data from API:', error);
      return []; // Return empty array on error
    });
}
*/
function fetchWaiters() {
  return new Promise((resolve) => {
    // Skift ud med API kald til hent tjenere
    const waiters = [
      {
        id: 1,
        name: "John Smith",
        image: "https://randomuser.me/api/portraits/men/2.jpg",
      },
      {
        id: 2,
        name: "Sarah Johnson",
        image: "https://randomuser.me/api/portraits/women/52.jpg",
      },
      {
        id: 3,
        name: "Michael Chen",
        image: "https://randomuser.me/api/portraits/men/1.jpg",
      },
      {
        id: 4,
        name: "Emma Wilson",
        image: "https://randomuser.me/api/portraits/women/33.jpg",
      },
      {
        id: 5,
        name: "David Lopez",
        image: "https://randomuser.me/api/portraits/men/77.jpg",
      },
      {
        id: 6,
        name: "Aisha Patel",
        image: "https://randomuser.me/api/portraits/women/55.jpg",
      },
    ];
    resolve(waiters);
  });
}
//remove when api is implemented
function saveFile(data) {
  try {
    // Get existing feedback data from localStorage
    let feedbackHistory = JSON.parse(
      localStorage.getItem("feedbackData") || "[]"
    );

    // Add new feedback data to the array
    feedbackHistory.push(data);
   
    console.log("Feedback saved", data);
    return true;
  } catch (error) {
    console.error("Error saving feedback to localStorage:", error);
    return false;
  }
}
