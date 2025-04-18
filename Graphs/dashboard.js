document.addEventListener("DOMContentLoaded", function () {
  // Initialize global chart variables
  let timeOfDayChart,
    dayOfWeekChart,
    waiterPerformanceChart,
    improvementAreasChart,
    trendChart;

  // Add event listeners
  document
    .getElementById("applyFilters")
    .addEventListener("click", function () {
      loadDashboardData();
    });

  document
    .getElementById("trendChartType")
    .addEventListener("change", function () {
      // Reload only the trend chart when type changes
      loadDashboardData(true); // true = only update trend chart
    });

  function formatDateTimeForInput(date) {
    // Format as YYYY-MM-DDThh:mm
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0") +
      "T" +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0")
    );
  }
  // Date range filter change event
  document
    .getElementById("dateRangeFilter")
    .addEventListener("change", function () {
      const selectedValue = this.value;
      const yearSelectorContainer = document.getElementById(
        "yearSelectorContainer"
      );
      const dateRangeContainer = document.getElementById("dateRangeContainer");

      yearSelectorContainer.style.display = "none";
      dateRangeContainer.style.display = "none";

      if (selectedValue === "year") {
        yearSelectorContainer.style.display = "block";

        // Populate year selector if it's empty
        if (document.getElementById("yearSelector").options.length <= 0) {
          populateYearSelector();
        }
      } else if (selectedValue === "custom") {
        dateRangeContainer.style.display = "block";

        // Set default values for date inputs if they're empty
        const startDate = document.getElementById("startDate");
        const endDate = document.getElementById("endDate");

        if (!startDate.value) {
          // Set start date to beginning of current day
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate.value = formatDateTimeForInput(today);
        }
        if (!endDate.value) {
          // Set end date to current time
          const now = new Date();
          endDate.value = formatDateTimeForInput(now);
        }
      }
    });

  // Populate the year selector with available years from data
  function populateYearSelector() {
    const yearSelector = document.getElementById("yearSelector");
    yearSelector.innerHTML = ""; // Clear existing options

    fetchData()
      .then((feedbackData) => {
        if (feedbackData.length === 0) {
          // Add current year if no data
          const currentYear = new Date().getFullYear();
          const option = document.createElement("option");
          option.value = currentYear;
          option.textContent = currentYear;
          yearSelector.appendChild(option);
          return;
        }

        // Get all years from the data
        const years = new Set();
        feedbackData.forEach((item) => {
          const date = new Date(item.Time * 1000);
          years.add(date.getFullYear());
        });

        // Convert to array and sort in descending order (newest first)
        const sortedYears = Array.from(years).sort((a, b) => b - a);

        // Add options to the selector
        sortedYears.forEach((year) => {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year;
          yearSelector.appendChild(option);
        });

        // Add current year if it's not in the list
        const currentYear = new Date().getFullYear();
        if (!sortedYears.includes(currentYear)) {
          const option = document.createElement("option");
          option.value = currentYear;
          option.textContent = currentYear;
          yearSelector.insertBefore(option, yearSelector.firstChild);
        }
      })
      .catch((error) => {
        console.error("Error populating year selector:", error);
        // Add current year as fallback in case of error
        const currentYear = new Date().getFullYear();
        const option = document.createElement("option");
        option.value = currentYear;
        option.textContent = currentYear;
        yearSelector.appendChild(option);
      });
  }

  // Initial setup - check if year or custom option is selected
  const initialDateRange = document.getElementById("dateRangeFilter").value;
  if (initialDateRange === "year") {
    document.getElementById("yearSelectorContainer").style.display = "block";
    document.getElementById("dateRangeContainer").style.display = "none";
    populateYearSelector();
  } else if (initialDateRange === "custom") {
    document.getElementById("yearSelectorContainer").style.display = "none";
    document.getElementById("dateRangeContainer").style.display = "block";
  } else {
    document.getElementById("yearSelectorContainer").style.display = "none";
    document.getElementById("dateRangeContainer").style.display = "none";
  }

  // Initialize dashboard
  loadDashboardData();

  /**
   * Load and process feedback data based on selected filters
   */
  function loadDashboardData(updateTrendChartOnly = false) {
    // Get filter values
    const dateRange = document.getElementById("dateRangeFilter").value;
    const ratingFilter = document.getElementById("ratingFilter").value;

    fetchData()
      .then((feedbackData) => {
        // Apply filters
        let filteredData = [...feedbackData];

        // Apply date filter based on selection
        if (dateRange === "year") {
          // Filter for a specific year
          const yearSelector = document.getElementById("yearSelector");
          if (yearSelector.value) {
            const selectedYear = parseInt(yearSelector.value);
            const startOfYear = new Date(selectedYear, 0, 1, 0, 0, 0);
            const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);

            filteredData = filteredData.filter((item) => {
              const date = new Date(item.Time * 1000);
              return date >= startOfYear && date <= endOfYear;
            });
          }
        } else if (dateRange === "custom") {
          // Get values from date pickers
          const startDateInput = document.getElementById("startDate").value;
          const endDateInput = document.getElementById("endDate").value;

          // Only apply filter if both dates are provided
          if (startDateInput && endDateInput) {
            const startDate = new Date(startDateInput);
            const endDate = new Date(endDateInput);

            // Convert to timestamp (in seconds) for comparison with data
            const startTimestamp = Math.floor(startDate.getTime() / 1000);
            const endTimestamp = Math.floor(endDate.getTime() / 1000);

            filteredData = filteredData.filter(
              (item) => item.Time >= startTimestamp && item.Time <= endTimestamp
            );
          }
        } else if (
          dateRange === "7" ||
          dateRange === "30" ||
          dateRange === "90" ||
          dateRange === "365"
        ) {
          // Apply standard date range filter for day-based options
          const days = parseInt(dateRange);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

          filteredData = filteredData.filter(
            (item) => parseInt(item.Time) > cutoffTimestamp
          );
        }

        // Apply rating filter if not "all"
        if (ratingFilter !== "all") {
          filteredData = filteredData.filter(
            (item) => item.Grade === parseInt(ratingFilter)
          );
        }

        // If only updating trend chart, just update that and return
        if (updateTrendChartOnly) {
          updateTrendChart(filteredData);
          return;
        }

        // Otherwise update everything
        updateSummaryMetrics(filteredData);
        updateTimeOfDayChart(filteredData);
        updateDayOfWeekChart(filteredData);
        updateWaiterPerformanceChart(filteredData);
        updateImprovementAreasChart(filteredData);
        updateTrendChart(filteredData);

        // Console log for debugging
        console.log(
          `Applied filters - Date range: ${dateRange}, Rating: ${ratingFilter}`
        );
        console.log(`Filtered data count: ${filteredData.length}`);
      })
      .catch((error) => {
        console.error("Error loading dashboard data:", error);
      });
  }

  /**
   * Update summary metrics at the top of dashboard
   */
  function updateSummaryMetrics(data) {
    // Average rating calculation
    let avgRating = 0;
    if (data.length > 0) {
      const totalRating = data.reduce((sum, item) => sum + item.Grade, 0);
      avgRating = totalRating / data.length;
    }
    document.getElementById("averageRating").textContent = avgRating.toFixed(1);

    // Total feedback count
    document.getElementById("totalFeedback").textContent = data.length;

    // Total waiter acknowledgments
    const acknowledgments = data.filter(
      (item) => item.Waiter !== null && item.Waiter !== "Skipped"
    ).length;
    document.getElementById("totalAcknowledgments").textContent =
      acknowledgments;

    // Top issue calculation
    const issues = {
      Mad: data.filter((item) => item.Food).length,
      Service: data.filter((item) => item.Service).length,
      Oplevelse: data.filter((item) => item.Atmosphere).length,
    };

    let topIssue = "-";
    let maxCount = 0;

    for (const [issue, count] of Object.entries(issues)) {
      if (count > maxCount) {
        maxCount = count;
        topIssue = issue;
      }
    }

    // Only show if there are any issues reported
    if (maxCount > 0) {
      document.getElementById("topIssue").textContent = topIssue;
    } else {
      document.getElementById("topIssue").textContent = "-";
    }
  }

  /**
   * Chart showing ratings by time of day
   */
  function updateTimeOfDayChart(data) {
    const hourCounts = Array(24).fill(0);
    const hourRatings = Array(24).fill(0);
    const hasDataForHour = Array(24).fill(false);

    // Group data by hour
    data.forEach((item) => {
      const date = new Date(item.Time * 1000);
      const hour = date.getHours();
      hourCounts[hour]++;
      hourRatings[hour] += item.Grade;
      hasDataForHour[hour] = true;
    });

    // Create arrays with null values for hours with no data
    const hourlyAvgRatings = hourRatings.map((sum, index) =>
      hasDataForHour[index] ? sum / hourCounts[index] : null
    );

    // Create labels for all hours
    const labels = Array(24)
      .fill()
      .map((_, i) => {
        // Format as 00:00, 01:00, etc.
        return `${i.toString().padStart(2, "0")}:00`;
      });

    const ctx = document.getElementById("timeOfDayChart").getContext("2d");

    // Destroy previous chart if it exists
    if (timeOfDayChart) {
      timeOfDayChart.destroy();
    }

    // Create new chart
    timeOfDayChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Gns. Bedømmelse",
            data: hourlyAvgRatings,
            borderColor: "#3d5252",
            backgroundColor: "rgba(61, 82, 82, 0.1)",
            borderWidth: 2,
            pointBackgroundColor: "#3d5252",
            tension: 0.2,
            yAxisID: "y",
            spanGaps: true, // Connect lines across gaps (null values)
          },
          {
            label: "Antal Bedømmelser",
            data: hourCounts,
            borderColor: "#e5c070",
            backgroundColor: "rgba(229, 192, 112, 0.5)",
            borderWidth: 1,
            type: "bar",
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            min: 1, // Start at 1 instead of 0 to avoid misleading low scores
            max: 3,
            position: "left",
            title: {
              display: true,
              text: "Gns. Bedømmelse",
            },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: "Antal",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                // Don't show tooltip for null values
                if (context.raw === null) return null;

                const label = context.dataset.label || "";
                return `${label}: ${context.raw?.toFixed(1) || "Ingen data"}`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Chart showing ratings by day of week
   */
  function updateDayOfWeekChart(data) {
    const originalDays = [
      "Søndag",
      "Mandag",
      "Tirsdag",
      "Onsdag",
      "Torsdag",
      "Fredag",
      "Lørdag",
    ];

    const dayCounts = Array(7).fill(0);
    const dayRatings = Array(7).fill(0);
    const hasDataForDay = Array(7).fill(false);

    // Group data by day of week
    data.forEach((item) => {
      const date = new Date(item.Time * 1000);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      dayCounts[dayOfWeek]++;
      dayRatings[dayOfWeek] += item.Grade;
      hasDataForDay[dayOfWeek] = true;
    });

    // Calculate averages - set null for days with no data
    const dayAvgRatings = dayRatings.map((sum, index) =>
      hasDataForDay[index] ? sum / dayCounts[index] : null
    );

    // Shift arrays to start from Monday (index 1)
    const shiftArray = (arr) => arr.slice(1).concat(arr.slice(0, 1));
    const days = shiftArray(originalDays);
    const shiftedDayCounts = shiftArray(dayCounts);
    const shiftedDayAvgRatings = shiftArray(dayAvgRatings);

    const ctx = document.getElementById("dayOfWeekChart").getContext("2d");

    // Destroy previous chart if it exists
    if (dayOfWeekChart) {
      dayOfWeekChart.destroy();
    }

    // Create new chart
    dayOfWeekChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: days,
        datasets: [
          {
            label: "Gns. Bedømmelse",
            data: shiftedDayAvgRatings,
            borderColor: "#3d5252",
            backgroundColor: "rgba(61, 82, 82, 0.1)",
            borderWidth: 2,
            pointBackgroundColor: "#3d5252",
            tension: 0.2,
            yAxisID: "y",
            spanGaps: true,
          },
          {
            label: "Antal Bedømmelser",
            data: shiftedDayCounts,
            borderColor: "#e5c070",
            backgroundColor: "rgba(229, 192, 112, 0.5)",
            borderWidth: 1,
            type: "bar",
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            min: 1,
            max: 3,
            position: "left",
            title: {
              display: true,
              text: "Gns. Bedømmelse",
            },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: "Antal",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                if (context.raw === null) return null;
                const label = context.dataset.label || "";
                return `${label}: ${context.raw?.toFixed(1) || "Ingen data"}`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Chart showing waiter acknowledgments
   */
  function updateWaiterPerformanceChart(data) {
    // Get all waiters first
    fetchWaiters().then((waiters) => {
      const waiterMap = {};
      waiters.forEach((waiter) => {
        waiterMap[waiter.id] = {
          name: waiter.name,
          count: 0,
          total: 0,
          avg: 0,
        };
      });

      // Filter out skipped waiters and aggregate data
      data
        .filter((item) => item.Waiter !== null && item.Waiter !== "Skipped")
        .forEach((item) => {
          const waiterId = item.Waiter;
          if (waiterMap[waiterId]) {
            waiterMap[waiterId].count++;
            waiterMap[waiterId].total += item.Grade;
          }
        });

      // Calculate averages
      for (const waiterId in waiterMap) {
        if (waiterMap[waiterId].count > 0) {
          waiterMap[waiterId].avg =
            waiterMap[waiterId].total / waiterMap[waiterId].count;
        }
      }

      // Convert to arrays for Chart.js and sort by number of acknowledgments
      let waitersWithData = [];
      for (const waiterId in waiterMap) {
        if (waiterMap[waiterId].count > 0) {
          waitersWithData.push({
            name: waiterMap[waiterId].name,
            count: waiterMap[waiterId].count,
            avg: waiterMap[waiterId].avg,
          });
        }
      }

      // Sort by number of acknowledgments (descending)
      waitersWithData.sort((a, b) => b.count - a.count);

      // Extract sorted arrays
      const waiterNames = waitersWithData.map((w) => w.name);
      const waiterAcknowledgments = waitersWithData.map((w) => w.count);
      const waiterAvgRatings = waitersWithData.map((w) => w.avg);

      // Show a message if no waiter acknowledgments
      if (waiterNames.length === 0) {
        const container = document.getElementById(
          "waiterPerformanceChart"
        ).parentNode;
        if (waiterPerformanceChart) {
          waiterPerformanceChart.destroy();
          waiterPerformanceChart = null;
        }

        container.innerHTML =
          '<div class="text-center py-4"><p>Ingen tjeneranerkendelser i den valgte periode.</p></div>';
        return;
      }

      const ctx = document
        .getElementById("waiterPerformanceChart")
        .getContext("2d");

      // Destroy previous chart if it exists
      if (waiterPerformanceChart) {
        waiterPerformanceChart.destroy();
      }

      // Create new chart
      waiterPerformanceChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: waiterNames,
          datasets: [
            {
              label: "Antal anerkendelser",
              data: waiterAcknowledgments,
              backgroundColor: "rgba(229, 192, 112, 0.7)",
              borderColor: "#e5c070",
              borderWidth: 1,
              yAxisID: "y",
            },
            {
              label: "Gns. Bedømmelse for feedback med anerkendelse",
              data: waiterAvgRatings,
              backgroundColor: "rgba(61, 82, 82, 0.7)",
              borderColor: "#3d5252",
              borderWidth: 1,
              type: "line",
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              position: "left",
              title: {
                display: true,
                text: "Antal Anerkendelser",
              },
            },
            y1: {
              beginAtZero: true,
              min: 1, // Start at 1 instead of 0
              max: 3,
              position: "right",
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: "Gns. Bedømmelse",
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.dataset.label || "";
                  const value = context.raw || 0;

                  if (label.includes("Bedømmelse")) {
                    return `${label}: ${value.toFixed(1)}`;
                  }
                  return `${label}: ${value}`;
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Chart showing improvement areas (pie chart)
   */
  function updateImprovementAreasChart(data) {
    // Count types of improvement areas
    const foodCount = data.filter((item) => item.Food).length;
    const serviceCount = data.filter((item) => item.Service).length;
    const atmosphereCount = data.filter((item) => item.Atmosphere).length;

    // If there are no improvement areas reported, show a message
    const totalIssues = foodCount + serviceCount + atmosphereCount;
    if (totalIssues === 0) {
      const container = document.getElementById(
        "improvementAreasChart"
      ).parentNode;
      if (improvementAreasChart) {
        improvementAreasChart.destroy();
        improvementAreasChart = null;
      }

      container.innerHTML =
        '<div class="text-center py-4"><p>Ingen forbedringsområder rapporteret i den valgte periode.</p></div>';
      return;
    }

    const ctx = document
      .getElementById("improvementAreasChart")
      .getContext("2d");

    // Destroy previous chart if it exists
    if (improvementAreasChart) {
      improvementAreasChart.destroy();
    }

    // Create new chart
    improvementAreasChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Mad", "Service", "Oplevelse"],
        datasets: [
          {
            data: [foodCount, serviceCount, atmosphereCount],
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        // Disable all interactions with the chart
        events: [],
      },
    });
  }

  /**
   * Chart showing rating trends over time
   */
  function updateTrendChart(data) {
    if (data.length === 0) {
      if (trendChart) {
        trendChart.destroy();
        trendChart = null;
      }

      const container = document.getElementById("trendChart").parentNode;
      container.innerHTML =
        '<div class="text-center py-4"><p>Ingen data i den valgte periode.</p></div>';
      return;
    }

    // Sort data by time
    data.sort((a, b) => a.Time - b.Time);

    // Get the selected date range
    const dateRange = document.getElementById("dateRangeFilter").value;
    const yearSelector = document.getElementById("yearSelector");

    // Labels and data arrays
    const labels = [];
    const avgRatings = [];
    const feedbackCounts = [];
    const foodIssues = [];
    const serviceIssues = [];
    const atmosphereIssues = [];

    // Determine the appropriate time grouping based on date range and data span
    if (dateRange === "7") {
      // Group by day for 7-day view
      const dailyData = {};

      // Create entries for all 7 days, even if there's no data
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dayKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Create formatted label (e.g., "Man 15/4")
        const dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
        const dayOfWeek = dayNames[date.getDay()];
        const dayOfMonth = date.getDate();
        const month = date.getMonth() + 1;
        const formattedLabel = `${dayOfWeek} ${dayOfMonth}/${month}`;

        dailyData[dayKey] = {
          label: formattedLabel,
          timestamp: Math.floor(date.getTime() / 1000),
          count: 0,
          total: 0,
          food: 0,
          service: 0,
          atmosphere: 0,
        };
      }

      // Process data for each feedback entry
      data.forEach((item) => {
        const date = new Date(item.Time * 1000);
        const dayKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        if (dailyData[dayKey]) {
          dailyData[dayKey].count++;
          dailyData[dayKey].total += item.Grade;
          if (item.Food) dailyData[dayKey].food++;
          if (item.Service) dailyData[dayKey].service++;
          if (item.Atmosphere) dailyData[dayKey].atmosphere++;
        }
      });

      // Sort days chronologically
      const sortedDays = Object.values(dailyData).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Populate the data arrays
      sortedDays.forEach((day) => {
        labels.push(day.label);
        avgRatings.push(day.count > 0 ? day.total / day.count : null);
        feedbackCounts.push(day.count);
        foodIssues.push(day.food);
        serviceIssues.push(day.service);
        atmosphereIssues.push(day.atmosphere);
      });
    } else if (dateRange === "30") {
      // Group by day for 30-day view, but use a more compact representation
      const dailyData = {};

      // Create entries for all 30 days, even if there's no data
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dayKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // More compact date format for 30-day view (e.g., "15/4")
        const dayOfMonth = date.getDate();
        const month = date.getMonth() + 1;
        const formattedLabel = `${dayOfMonth}/${month}`;

        dailyData[dayKey] = {
          label: formattedLabel,
          timestamp: Math.floor(date.getTime() / 1000),
          count: 0,
          total: 0,
          food: 0,
          service: 0,
          atmosphere: 0,
        };
      }

      // Process data for each feedback entry
      data.forEach((item) => {
        const date = new Date(item.Time * 1000);
        const dayKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

        if (dailyData[dayKey]) {
          dailyData[dayKey].count++;
          dailyData[dayKey].total += item.Grade;
          if (item.Food) dailyData[dayKey].food++;
          if (item.Service) dailyData[dayKey].service++;
          if (item.Atmosphere) dailyData[dayKey].atmosphere++;
        }
      });

      // Sort days chronologically
      const sortedDays = Object.values(dailyData).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Populate the data arrays
      sortedDays.forEach((day) => {
        labels.push(day.label);
        avgRatings.push(day.count > 0 ? day.total / day.count : null);
        feedbackCounts.push(day.count);
        foodIssues.push(day.food);
        serviceIssues.push(day.service);
        atmosphereIssues.push(day.atmosphere);
      });
    } else if (dateRange === "90") {
      // Group by week for 90-day view
      const weeklyData = {};

      // Calculate the cutoff date (90 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      // Process data
      data.forEach((item) => {
        const date = new Date(item.Time * 1000);

        // Skip data older than the cutoff
        if (date < cutoffDate) return;

        // Create a week identifier (YYYY-WW)
        const year = date.getFullYear();
        const weekNum = getWeekNumber(date);
        const weekKey = `${year}-${weekNum}`;

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            label: `Uge ${weekNum}`,
            timestamp: item.Time,
            count: 0,
            total: 0,
            food: 0,
            service: 0,
            atmosphere: 0,
          };
        }

        weeklyData[weekKey].count++;
        weeklyData[weekKey].total += item.Grade;
        if (item.Food) weeklyData[weekKey].food++;
        if (item.Service) weeklyData[weekKey].service++;
        if (item.Atmosphere) weeklyData[weekKey].atmosphere++;
      });

      // Sort weeks chronologically
      const sortedWeeks = Object.values(weeklyData).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Populate the data arrays
      sortedWeeks.forEach((week) => {
        labels.push(week.label);
        avgRatings.push(week.count > 0 ? week.total / week.count : null);
        feedbackCounts.push(week.count);
        foodIssues.push(week.food);
        serviceIssues.push(week.service);
        atmosphereIssues.push(week.atmosphere);
      });
    } else if (dateRange === "365") {
      // Group by month for yearly view
      const monthlyData = {};

      // Calculate the cutoff date (1 year ago)
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      // Define month names
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Maj",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dec",
      ];

      // Create entries for all 12 months, even if there's no data
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        // Format: "Apr '25"
        const monthName = monthNames[date.getMonth()];
        const shortYear = date.getFullYear().toString().slice(2);
        const formattedLabel = `${monthName} '${shortYear}`;

        monthlyData[monthKey] = {
          label: formattedLabel,
          timestamp: Math.floor(date.getTime() / 1000),
          count: 0,
          total: 0,
          food: 0,
          service: 0,
          atmosphere: 0,
        };
      }

      // Process data
      data.forEach((item) => {
        const date = new Date(item.Time * 1000);

        // Skip data older than the cutoff
        if (date < cutoffDate) return;

        // Create a month identifier (YYYY-M)
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].count++;
          monthlyData[monthKey].total += item.Grade;
          if (item.Food) monthlyData[monthKey].food++;
          if (item.Service) monthlyData[monthKey].service++;
          if (item.Atmosphere) monthlyData[monthKey].atmosphere++;
        }
      });

      // Sort months chronologically
      const sortedMonths = Object.values(monthlyData).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Populate the data arrays
      sortedMonths.forEach((month) => {
        labels.push(month.label);
        avgRatings.push(month.count > 0 ? month.total / month.count : null);
        feedbackCounts.push(month.count);
        foodIssues.push(month.food);
        serviceIssues.push(month.service);
        atmosphereIssues.push(month.atmosphere);
      });
    } else if (dateRange === "year" && yearSelector.value) {
      // Specific year view - group by month
      const monthlyData = {};
      const selectedYear = parseInt(yearSelector.value);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Maj",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dec",
      ];

      // Create entries for all 12 months of the selected year
      for (let month = 0; month < 12; month++) {
        const monthKey = `${selectedYear}-${month + 1}`;
        monthlyData[monthKey] = {
          label: monthNames[month],
          timestamp: new Date(selectedYear, month, 15).getTime() / 1000,
          count: 0,
          total: 0,
          food: 0,
          service: 0,
          atmosphere: 0,
        };
      }

      // Process data for the selected year
      data.forEach((item) => {
        const date = new Date(item.Time * 1000);

        // Only include data from the selected year
        if (date.getFullYear() !== selectedYear) return;

        const monthKey = `${selectedYear}-${date.getMonth() + 1}`;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].count++;
          monthlyData[monthKey].total += item.Grade;
          if (item.Food) monthlyData[monthKey].food++;
          if (item.Service) monthlyData[monthKey].service++;
          if (item.Atmosphere) monthlyData[monthKey].atmosphere++;
        }
      });

      // Sort months chronologically
      const sortedMonths = Object.values(monthlyData).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      // Populate the data arrays
      sortedMonths.forEach((month) => {
        labels.push(month.label);
        avgRatings.push(month.count > 0 ? month.total / month.count : null);
        feedbackCounts.push(month.count);
        foodIssues.push(month.food);
        serviceIssues.push(month.service);
        atmosphereIssues.push(month.atmosphere);
      });
    } else {
      // Fallback - group by appropriate time unit based on data range
      // First, determine the date range of the data
      const firstDate = new Date(data[0].Time * 1000);
      const lastDate = new Date(data[data.length - 1].Time * 1000);
      const dateSpanDays = Math.floor(
        (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      );

      // Choose grouping method based on how much data we have
      if (dateSpanDays <= 30) {
        // For <= 30 days of data, group by day
        const dailyData = {};

        data.forEach((item) => {
          const date = new Date(item.Time * 1000);
          const dayKey = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

          const dayOfMonth = date.getDate();
          const month = date.getMonth() + 1;
          const formattedLabel = `${dayOfMonth}/${month}`;

          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
              label: formattedLabel,
              timestamp: item.Time,
              count: 0,
              total: 0,
              food: 0,
              service: 0,
              atmosphere: 0,
            };
          }

          dailyData[dayKey].count++;
          dailyData[dayKey].total += item.Grade;
          if (item.Food) dailyData[dayKey].food++;
          if (item.Service) dailyData[dayKey].service++;
          if (item.Atmosphere) dailyData[dayKey].atmosphere++;
        });

        // Sort and populate data
        const sortedDays = Object.values(dailyData).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        sortedDays.forEach((day) => {
          labels.push(day.label);
          avgRatings.push(day.count > 0 ? day.total / day.count : null);
          feedbackCounts.push(day.count);
          foodIssues.push(day.food);
          serviceIssues.push(day.service);
          atmosphereIssues.push(day.atmosphere);
        });
      } else if (dateSpanDays <= 180) {
        // For <= 180 days (~6 months) of data, group by week
        const weeklyData = {};

        data.forEach((item) => {
          const date = new Date(item.Time * 1000);
          const year = date.getFullYear();
          const weekNum = getWeekNumber(date);
          const weekKey = `${year}-${weekNum}`;

          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
              label: `Uge ${weekNum}`,
              timestamp: item.Time,
              count: 0,
              total: 0,
              food: 0,
              service: 0,
              atmosphere: 0,
            };
          }

          weeklyData[weekKey].count++;
          weeklyData[weekKey].total += item.Grade;
          if (item.Food) weeklyData[weekKey].food++;
          if (item.Service) weeklyData[weekKey].service++;
          if (item.Atmosphere) weeklyData[weekKey].atmosphere++;
        });

        // Sort and populate data
        const sortedWeeks = Object.values(weeklyData).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        sortedWeeks.forEach((week) => {
          labels.push(week.label);
          avgRatings.push(week.count > 0 ? week.total / week.count : null);
          feedbackCounts.push(week.count);
          foodIssues.push(week.food);
          serviceIssues.push(week.service);
          atmosphereIssues.push(week.atmosphere);
        });
      } else {
        // For > 180 days of data, group by month
        const monthlyData = {};
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Maj",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Okt",
          "Nov",
          "Dec",
        ];

        data.forEach((item) => {
          const date = new Date(item.Time * 1000);
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

          // Format label
          const monthName = monthNames[date.getMonth()];
          const shortYear = date.getFullYear().toString().slice(2);
          const formattedLabel = `${monthName} '${shortYear}`;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              label: formattedLabel,
              timestamp: item.Time,
              count: 0,
              total: 0,
              food: 0,
              service: 0,
              atmosphere: 0,
            };
          }

          monthlyData[monthKey].count++;
          monthlyData[monthKey].total += item.Grade;
          if (item.Food) monthlyData[monthKey].food++;
          if (item.Service) monthlyData[monthKey].service++;
          if (item.Atmosphere) monthlyData[monthKey].atmosphere++;
        });

        // Sort and populate data
        const sortedMonths = Object.values(monthlyData).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        sortedMonths.forEach((month) => {
          labels.push(month.label);
          avgRatings.push(month.count > 0 ? month.total / month.count : null);
          feedbackCounts.push(month.count);
          foodIssues.push(month.food);
          serviceIssues.push(month.service);
          atmosphereIssues.push(month.atmosphere);
        });
      }
    }

    const ctx = document.getElementById("trendChart").getContext("2d");

    // Destroy previous chart if it exists
    if (trendChart) {
      trendChart.destroy();
    }

    // Get selected chart type
    const chartType = document.getElementById("trendChartType").value;

    // Define chart configuration based on selected type
    let chartConfig = {
      type: "line",
      data: {
        labels: labels,
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || "";
                const value = context.raw;

                if (value === null) return null;

                if (chartType === "ratings") {
                  return `${label}: ${value.toFixed(1)}`;
                } else {
                  return `${label}: ${value}`;
                }
              },
            },
          },
          title: {
            display: dateRange === "year" && yearSelector.value,
            text: dateRange === "year" ? `${yearSelector.value}` : "",
            font: {
              size: 16,
            },
          },
        },
      },
    };

    // Configure chart based on selected type
    switch (chartType) {
      case "ratings":
        chartConfig.data.datasets = [
          {
            label: "Gns. Bedømmelse",
            data: avgRatings,
            borderColor: "#3d5252",
            backgroundColor: "rgba(61, 82, 82, 0.1)",
            borderWidth: 2,
            tension: 0.2,
            spanGaps: true,
          },
        ];
        chartConfig.options.scales.y.min = 1;
        chartConfig.options.scales.y.max = 3;
        chartConfig.options.scales.y.title.text = "Gennemsnitlig bedømmelse";
        break;

      case "food":
        chartConfig.data.datasets = [
          {
            label: "Madproblemer",
            data: foodIssues,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            borderWidth: 2,
            tension: 0.2,
          },
        ];
        chartConfig.options.scales.y.title.text = "Antal madproblemer";
        break;

      case "service":
        chartConfig.data.datasets = [
          {
            label: "Serviceproblemer",
            data: serviceIssues,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            borderWidth: 2,
            tension: 0.2,
          },
        ];
        chartConfig.options.scales.y.title.text = "Antal serviceproblemer";
        break;

      case "atmosphere":
        chartConfig.data.datasets = [
          {
            label: "Oplevelsesroblemer",
            data: atmosphereIssues,
            borderColor: "rgba(255, 206, 86, 1)",
            backgroundColor: "rgba(255, 206, 86, 0.1)",
            borderWidth: 2,
            tension: 0.2,
          },
        ];
        chartConfig.options.scales.y.title.text = "Antal oplevelsesroblemer";
        break;

      case "count":
        chartConfig.data.datasets = [
          {
            label: "Antal bedømmelser",
            data: feedbackCounts,
            borderColor: "#e5c070",
            backgroundColor: "rgba(229, 192, 112, 0.1)",
            borderWidth: 2,
            tension: 0.2,
          },
        ];
        chartConfig.options.scales.y.title.text = "Antal bedømmelser";
        break;
    }

    // Create new chart
    trendChart = new Chart(ctx, chartConfig);
  }

  /**
   * Helper function to get week number from date
   */
  function getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  /**
   * Fetch feedback data from testfeedback.json file
   * @returns {Promise<Array>} Promise resolving to an array of feedback items
   */
  function fetchData() {
    return fetch("testfeedback.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load feedback data");
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Error loading feedback data:", error);
        return []; // Return empty array on error
      });
  }

  /**
   * API version of fetchData
   * @returns {Promise<Array>} Promise resolving to an array of feedback items
   */
  /*
function fetchData() {
  return fetch('https://youku.dk/feedback')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load feedback data from API');
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error loading feedback data from API:', error);
      return []; // Return empty array on error
    });
}
*/

  /**
   * Helper function to fetch waiters
   */
  function fetchWaiters() {
    return new Promise((resolve) => {
      const waiters = [
        {
          id: 1,
          name: "John Smith",
          image: "https://randomuser.me/api/portraits/men/40.jpg",
        },
        {
          id: 2,
          name: "Sarah Johnson",
          image: "https://randomuser.me/api/portraits/women/42.jpg",
        },
        {
          id: 3,
          name: "Michael Chen",
          image: "https://randomuser.me/api/portraits/men/22.jpg",
        },
        {
          id: 4,
          name: "Emma Wilson",
          image: "https://randomuser.me/api/portraits/women/33.jpg",
        },
        {
          id: 5,
          name: "David Lopez",
          image: "https://randomuser.me/api/portraits/men/36.jpg",
        },
        {
          id: 6,
          name: "Aisha Patel",
          image: "https://randomuser.me/api/portraits/women/51.jpg",
        },
      ];
      resolve(waiters);
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
});
