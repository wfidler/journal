document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.querySelector(".sidebar");
  const mainContents = document.querySelectorAll(".content");
  const toggleButton = document.querySelector(".sidebar-toggle");
  const themeSelect = document.getElementById("themeSelect");
  const createEntryButton = document.getElementById("createEntryButton");
  const navButtons = document.querySelectorAll(".navButton");

  function checkContentWidth() {
    if (window.innerWidth < 600) {
      sidebar.classList.add("closed");
      sidebar.classList.remove("fullscreen");
      toggleButton.style.left = "1em";
      mainContents.forEach((content) => content.classList.add("expanded"));
    } else {
      sidebar.classList.remove("fullscreen", "closed");
      toggleButton.style.left = "17em";
      mainContents.forEach((content) => content.classList.remove("expanded"));
    }
  }

  checkContentWidth();
  window.addEventListener("resize", checkContentWidth);

  toggleButton.addEventListener("click", function () {
    const isSmallScreen = window.innerWidth < 600;

    if (isSmallScreen) {
      const isFullscreen = sidebar.classList.contains("fullscreen");

      if (isFullscreen) {
        sidebar.classList.remove("fullscreen");
        sidebar.classList.add("closed");
        document.body.classList.remove("no-scroll");
      } else {
        sidebar.classList.add("fullscreen");
        sidebar.classList.remove("closed");
        document.body.classList.add("no-scroll");
      }
    } else {
      sidebar.classList.toggle("closed");
      mainContents.forEach((content) => content.classList.toggle("expanded"));
      toggleButton.style.left = sidebar.classList.contains("closed")
        ? "1em"
        : "17em";
    }
  });

  function getCurrentTheme() {
    const colorScheme = getComputedStyle(document.documentElement)
      .getPropertyValue("color-scheme")
      .trim();

    if (colorScheme.includes("light") && colorScheme.includes("dark"))
      return "system";
    if (colorScheme.includes("light")) return "light";
    if (colorScheme.includes("dark")) return "dark";

    return "system";
  }

  function setTheme(theme) {
    document.documentElement.style.setProperty(
      "color-scheme",
      theme === "system" ? "light dark" : theme
    );
    localStorage.setItem("theme", theme);
  }

  const savedTheme = localStorage.getItem("theme") || getCurrentTheme();
  setTheme(savedTheme);
  themeSelect.value = savedTheme;

  themeSelect.addEventListener("change", (event) =>
    setTheme(event.target.value)
  );

  createEntryButton.addEventListener("click", function () {
    try {
      createEntry();
    } catch (error) {
      console.error("Error creating entry:", error);
    }
  });

  navButtons.forEach((button) =>
    button.addEventListener("click", () =>
      showPage(button.getAttribute("data-target"))
    )
  );
});

function showPage(pageId) {
  const allPages = document.querySelectorAll(".content");
  allPages.forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    if (pageId === "previousEntries") loadEntries();
    targetPage.classList.add("active");
  }
}

async function createEntry() {
  const titleInput = document.querySelector(".entryTitleInput").value.trim();
  const contentInput = document
    .querySelector(".entryContentInput")
    .value.trim();
  const entryId = document
    .getElementById("createEntryButton")
    .getAttribute("data-id");

  if (!titleInput || !contentInput) {
    await window.electron.showMessageBox(
      "Please enter a title and content for your entry."
    );
    return;
  }

  let newEntryData = {
    title: titleInput,
    content: contentInput,
    date: new Date(),
  };

  if (entryId) {
    const existingEntryDate = document
      .getElementById("createEntryButton")
      .getAttribute("data-date");
    newEntryData.date = existingEntryDate || new Date();
  }

  try {
    let result;
    if (entryId) {
      result = await window.electron.updateEntry(entryId, newEntryData);
      console.log("Updated Entry:", result);
    } else {
      result = await window.electron.createEntry(newEntryData);
      console.log("New Entry:", result);
    }

    resetCreateEntryForm();

    loadEntries();

    showPage("previousEntries");
  } catch (error) {
    console.error("Error saving entry:", error);
  }
}

function resetCreateEntryForm() {
  document.querySelector(".entryTitleInput").value = "";
  document.querySelector(".entryContentInput").value = "";

  const createEntryButton = document.getElementById("createEntryButton");
  createEntryButton.textContent = "Create Entry";
  createEntryButton.removeAttribute("data-id");
  createEntryButton.removeAttribute("data-date");
}

async function loadEntries() {
  try {
    const entries = await window.electron.getEntries();
    entries.sort(
      (a, b) => new Date(b.dataValues.date) - new Date(a.dataValues.date)
    );

    const entryContainer = document.getElementById("entries");
    entryContainer.innerHTML = "";

    entries.forEach((entry) => {
      const entryData = entry.dataValues;
      const entryElement = document.createElement("div");
      entryElement.classList.add("entry");

      const entryDate = new Date(entryData.date);
      const entryDateFormatted = entryDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      const entryTimeFormatted = entryDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      entryElement.innerHTML = `
        <div class="entryHeading">
          <h3>${entryData.title}</h3>
          <h5 class="entry-date" data-full-date="${entryTimeFormatted}">${entryDateFormatted}</h5>
        </div>
        <p>${entryData.content}</p>
        <div class="entryMenu">
          <a><i class="fi fi-br-file-edit edit-entry" data-id="${entryData.id}"></i></a>
          <a><i class="fi fi-br-trash delete-entry" data-id="${entryData.id}"></i></a>
        </div>
      `;

      entryContainer.appendChild(entryElement);

      const deleteButton = entryElement.querySelector(".delete-entry");
      const editButton = entryElement.querySelector(".edit-entry");

      deleteButton.addEventListener("click", async () => {
        try {
          await deleteEntry(entryData.id);
        } catch (error) {
          console.error("Error deleting entry:", error);
        }
      });

      editButton.addEventListener("click", () => {
        const entryId = editButton.getAttribute("data-id");
        const entryDate = entryData.date;

        document.querySelector(".entryTitleInput").value = entryData.title;
        document.querySelector(".entryContentInput").value = entryData.content;

        const createEntryButton = document.getElementById("createEntryButton");
        createEntryButton.textContent = "Update Entry";
        createEntryButton.setAttribute("data-id", entryId);
        createEntryButton.setAttribute("data-date", entryDate);

        showPage("newEntry");
      });
    });
  } catch (error) {
    console.error("Error loading entries:", error);
  }
}

async function deleteEntry(entryId) {
  try {
    const response = await window.electron.deleteEntry(entryId);

    if (response.success) {
      loadEntries();
    } else {
      alert("Failed to delete entry: " + response.message);
    }
  } catch (error) {
    console.error("Error deleting entry:", error);
  }
}

async function updateEntry(entryId, updatedEntryData) {
  try {
    const entry = await Entry.findByPk(entryId);

    if (!entry) {
      return { success: false, message: "Entry not found" };
    }

    entry.title = updatedEntryData.title;
    entry.content = updatedEntryData.content;

    if (!updatedEntryData.date) {
      updatedEntryData.date = entry.date;
    }

    entry.date = updatedEntryData.date;
    await entry.save();

    return { success: true, message: "Entry updated successfully" };
  } catch (error) {
    console.error("Error updating entry:", error);
    return { success: false, message: "Error updating entry" };
  }
}
