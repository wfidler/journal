const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { initializeDatabase } = require("./models");

let win;
let db;
let Entry;
let Tag;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(async () => {
  const database = initializeDatabase(app);
  db = database.sequelize;
  Entry = database.Entry;
  Tag = database.Tag;

  try {
    await db.authenticate();
    await db.sync();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("get-entries", async () => {
  try {
    const entries = await Entry.findAll();
    return entries;
  } catch (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
});

ipcMain.handle("create-entry", async (event, entryData) => {
  try {
    const newEntry = await Entry.create(entryData);
    return newEntry;
  } catch (error) {
    console.error("Error saving entry:", error);
    throw error;
  }
});

ipcMain.handle("update-entry", async (event, entryId, updatedEntryData) => {
  try {
    const entry = await Entry.findByPk(entryId);
    if (!entry) {
      return { success: false, message: "Entry not found" };
    }

    entry.title = updatedEntryData.title;
    entry.content = updatedEntryData.content;
    entry.date = updatedEntryData.date;

    await entry.save();
    return { success: true, message: "Entry updated successfully" };
  } catch (error) {
    console.error("Error updating entry:", error);
    return { success: false, message: "Error updating entry" };
  }
});

ipcMain.handle("show-message-box", async (event, message) => {
  const result = await dialog.showMessageBox(win, {
    type: "error",
    title: "Validation Error",
    message: message,
    buttons: ["OK"],
  });
  return result;
});

ipcMain.handle("delete-entry", async (event, entryId) => {
  try {
    const deletedEntry = await Entry.destroy({
      where: { id: entryId },
    });

    if (deletedEntry) {
      return { success: true };
    } else {
      return { success: false, message: "Entry not found" };
    }
  } catch (error) {
    return { success: false, message: "Error deleting entry" };
  }
});
