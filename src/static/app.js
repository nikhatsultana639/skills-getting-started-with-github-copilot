document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        const participantsLabel = document.createElement("p");
        participantsLabel.className = "participants-label";
        participantsLabel.textContent = "Participants:";

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((email) => {
          const participantItem = document.createElement("li");
          participantItem.className = "participant-item";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove-button";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
            </svg>
          `;
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                showMessage(result.detail || "Failed to unregister participant.", "error");
                return;
              }

              showMessage(result.message, "success");
              await fetchActivities();
            } catch (error) {
              showMessage("Failed to unregister participant. Please try again.", "error");
              console.error("Error unregistering participant:", error);
            } finally {
              removeButton.disabled = false;
            }
          });

          participantItem.append(participantEmail, removeButton);
          participantsList.appendChild(participantItem);
        });

        activityCard.append(participantsLabel, participantsList);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
