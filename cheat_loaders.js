/*
gotcha noelnavernoe was here
wht r u doing here?
can i fuck your mom?
*/

// Inisialisasi kelas Java yang diperlukan
var File = Java.use("java.io.File");
var FileInputStream = Java.use("java.io.FileInputStream");
var FileOutputStream = Java.use("java.io.FileOutputStream");
var InputStreamReader = Java.use("java.io.InputStreamReader");
var BufferedReader = Java.use("java.io.BufferedReader");
var MessageDigest = Java.use("java.security.MessageDigest");

// Inisialisasi SharedPreferences
var prefName = "com.pixticle.bokuboku.patch.v2.playerprefs";
var prefs = context.getSharedPreferences(prefName, 0);
var editor = prefs.edit();

// Inisialisasi MediaPlayer
var MediaPlayer = Java.use("android.media.MediaPlayer");
var assetManager = context.getAssets();
var mediaPlayer = null;

// calculateFileMD5: Menghitung hash MD5 dari sebuah file
function calculateFileMD5(filePath) {
    try {
        var file = File.$new(filePath);
        if (!file.exists()) {
            return null;
        }
        var digest = MessageDigest.getInstance("MD5");
        var inputStream = FileInputStream.$new(file);
        var buffer = Java.array('byte', new Array(8192).fill(0));
        var bytesRead;
        while ((bytesRead = inputStream.read(buffer)) > 0) {
            digest.update(buffer, 0, bytesRead);
        }
        inputStream.close();
        var hashBytes = digest.digest();
        var hexString = "";
        for (var i = 0; i < hashBytes.length; i++) {
            var hex = (hashBytes[i] & 0xff).toString(16);
            if (hex.length === 1) hex = "0" + hex;
            hexString += hex;
        }
        return hexString;
    } catch (err) {
        return null;
    }
}

// checkLoaderValidity: Memverifikasi integritas file loader berdasarkan MD5
function checkLoaderValidity() {
    var expectedMD5 = "043f789f459219397127b4ff97cd9b2b";
    var libraryDir = context.getApplicationInfo().nativeLibraryDir.value;
    var loaderPath = libraryDir + "/libnoelcheats.so";
    var calculatedMD5 = calculateFileMD5(loaderPath);
    if (calculatedMD5 === null) {
        showToast("[MODS] Loader file unverified: 404", 1);
        return false;
    } else if (calculatedMD5 !== expectedMD5) {
        showToast("[MODS] Loader file unverified ❌", 1);
        return false;
    } else {
        showToast("[MODS] Loader file verified ✅", 0);
        return true;
    }
}

// playAlertSound: Memutar suara peringatan dari aset
function playAlertSound() {
    try {
        if (mediaPlayer === null) {
            mediaPlayer = MediaPlayer.$new();
        } else {
            mediaPlayer.reset();
        }
        var fd = assetManager.openFd("idiot.mp3");
        mediaPlayer.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
        mediaPlayer.prepare();
        mediaPlayer.setLooping(true);
        mediaPlayer.start();
        Java.scheduleOnMainThread(() => {
            setTimeout(() => {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
            }, 3600000);
        });
    } catch (err) {
        showToast("Error playing sound: " + err, 1);
    }
}

// deleteRecursive: Menghapus file atau direktori secara rekursif
function deleteRecursive(fileOrDir) {
    try {
        if (fileOrDir.isDirectory()) {
            var files = fileOrDir.listFiles();
            if (files !== null) {
                for (var i = 0; i < files.length; i++) {
                    deleteRecursive(files[i]);
                }
            }
        }
        fileOrDir.delete();
    } catch (e) {}
}

// clearApplicationCache: Membersihkan cache aplikasi
function clearApplicationCache() {
    try {
        var cacheDir = File.$new(context.getExternalCacheDir().getAbsolutePath());
        if (cacheDir.exists()) {
            deleteRecursive(cacheDir);
        }
    } catch (e) {}
}

// countModelFiles: Menghitung jumlah file model di direktori penyimpanan
function countModelFiles() {
    try {
        var storagePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Save/Model/";
        var targetDir = File.$new(storagePath);
        if (!targetDir.exists() || !targetDir.isDirectory()) {
            throw new Error("Model folder not found!");
        }
        var files = targetDir.listFiles();
        if (files === null) {
            throw new Error("Unable to read folder contents!");
        }
        var count = 0;
        for (var i = 0; i < files.length; i++) {
            var fileName = files[i].getName();
            if (/^Model__\d+\.txt$/.test(fileName)) {
                count++;
            }
        }
        var message = count + " Model detected";
        showToast("[MODS] " + message, 0);
        return count;
    } catch (err) {
        return 0;
    }
}

// countPortraitFiles: Menghitung jumlah file portrait di direktori penyimpanan
function countPortraitFiles() {
    try {
        var storagePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Save/Portrait/";
        var targetDir = File.$new(storagePath);
        if (!targetDir.exists() || !targetDir.isDirectory()) {
            throw new Error("Portrait folder not found!");
        }
        var files = targetDir.listFiles();
        if (files === null) {
            throw new Error("Unable to read folder contents!");
        }
        var count = 0;
        for (var i = 0; i < files.length; i++) {
            var fileName = files[i].getName();
            if (/^Portrait__\d+\.txt$/.test(fileName)) {
                count++;
            }
        }
        var message = count + " Portrait detected";
        showToast("[MODS] " + message, 0);
        return count;
    } catch (err) {
        return 0;
    }
}

// countWorldFolders: Menghitung jumlah folder world di direktori penyimpanan
function countWorldFolders() {
    try {
        var basePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Save/Creation/World/";
        var worldDir = File.$new(basePath);
        if (!worldDir.exists() || !worldDir.isDirectory()) {
            throw new Error("World directory not found!");
        }
        var directoryList = worldDir.listFiles();
        if (directoryList === null) {
            throw new Error("Failed to read directory contents!");
        }
        var folderCount = 0;
        for (var i = 0; i < directoryList.length; i++) {
            if (directoryList[i].isDirectory()) {
                folderCount++;
            }
        }
        var message = folderCount + " World detected";
        showToast("[MODS] " + message, 0);
        return folderCount;
    } catch (error) {
        return 0;
    }
}

// copyDefaultConfig: Menyalin konfigurasi default dari server
function copyDefaultConfig(configPath) {
    try {
        var githubUrl = "https://raw.githubusercontent.com/eLLFucker/cheat-loaders-projects/refs/heads/main/default_config.json";
        var configContent = fetchUrlRawText(githubUrl);
        if (configContent === null) {
            throw new Error("Failed to fetch config from server.");
        }
        var outputFile = File.$new(configPath);
        var outputStream = FileOutputStream.$new(outputFile);
        var bytes = Java.use("java.lang.String").$new(configContent).getBytes();
        outputStream.write(bytes);
        outputStream.close();
        showToast("[MODS] Default config copied ✅", 0);
    } catch (err) {
        showToast("Error copyDefaultConfig: " + err, 1);
        throw err;
    }
}

// removeJsonComments: Menghapus komentar dari string JSON
function removeJsonComments(jsonString) {
    return jsonString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
}

// loadConfig: Membaca dan memvalidasi file konfigurasi cheat
function loadConfig() {
    try {
        var basePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Mods/cheatLoader/";
        var configPath = basePath + "cheats_config.json";
        var baseFolder = File.$new(basePath);
        var configFile = File.$new(configPath);

        if (!baseFolder.exists() && !baseFolder.mkdirs()) throw new Error("Failed to create config folder.");
        if (!configFile.exists()) copyDefaultConfig(configPath);

        var fileReader = Java.use("java.io.FileReader").$new(configFile);
        var bufferedReader = BufferedReader.$new(fileReader);
        var jsonString = "",
            line;
        while ((line = bufferedReader.readLine()) !== null) jsonString += line + "\n";
        bufferedReader.close();

        var cleanJson = removeJsonComments(jsonString);
        var config = JSON.parse(cleanJson);

        // Nilai asli untuk validasi metadata
        var originalValues = {
            "author": "noelnavernoe",
            "tiktok": "@navernoel",
            "youtube": "@noelnoskill"
        };

        // Memeriksa perubahan pada metadata
        var alteredFields = [];
        if (config.metadata.author !== originalValues.author) alteredFields.push("Author");
        if (config.metadata.socialMedia.tiktok !== originalValues.tiktok) alteredFields.push("TikTok");
        if (config.metadata.socialMedia.youtube !== originalValues.youtube) alteredFields.push("YouTube");

        if (alteredFields.length > 0) {
            var errorMessage = "Idiot memodifikasi metadata: " + "metadata " + alteredFields.join(", ") + " diubah!";
            playAlertSound();
            showToast(errorMessage, 1);
            throw new Error(errorMessage);
        }

        return config;
    } catch (err) {
        showToast("" + err, 1);
        return null;
    }
}

// capNumericValue: Membatasi nilai numerik agar sesuai batas tertentu
function capNumericValue(value, fieldName) {
    var maxInt32 = 2147483647;
    var cappedValue = value;
    if (fieldName === "candy" && value > 1000000) {
        cappedValue = 999999;
    }
    if (cappedValue > maxInt32) {
        cappedValue = maxInt32;
    }
    return cappedValue;
}

// welcome: Memunculkan pesan welcome dengan username di boku boku
function WelcomeMsg() {
    var userName = prefs.getString("Account__User_Name", "");
    showToast("[MODS] User " + userName + " detected", 1);
}

// applyConfig: Menerapkan konfigurasi cheat ke SharedPreferences
function applyConfig(config) {
    try {
        // Custom Settings
        if (config.customSettings.playerProfile.playerName.enabled) {
            editor.putString("Account__User_Name", config.customSettings.playerProfile.playerName.value);
        }
        if (config.customSettings.playerProfile.birthYear.enabled) {
            var birthYear = capNumericValue(config.customSettings.playerProfile.birthYear.value, "birthYear");
            editor.putInt("Account__Birthday__Year", birthYear);
        }
        if (config.customSettings.economy.candy.enabled) {
            var candy = capNumericValue(config.customSettings.economy.candy.value, "candy");
            editor.putInt("Candy", candy);
        }
        var slotKeys = [
            "Dressing__Data__Slot__Number", "Data_Slot_Number", "Doll__Data__Slot__Number",
            "Jukebox__Playlist__Data__Slot__Number", "Paint__Painting__Data__Slot__Number",
            "Jukebox__Music_Library__Data__Slot__Number", "Paint__Palette__Data__Slot__Number",
            "Melody__Data__Slot__Number", "Block__Own__Data__Slot__Number",
            "Block__List__Data__Slot__Number", "Favorite__Data__Slot__Number",
            "Album_Slot_Number", "Portrait__Data__Slot__Number", "Block__Pack__Data__Slot__Number"
        ];
        if (config.customSettings.storage.dataSlots.enabled) {
            var dataSlots = capNumericValue(config.customSettings.storage.dataSlots.value, "dataSlots");
            slotKeys.forEach(function(key) {
                editor.putInt(key, dataSlots);
            });
        } else {
            slotKeys.forEach(function(key) {
                editor.putInt(key, 100);
            });
        }

        // Core Mods
        var taskKeys = [
            "Task_Rewarded_Birthday", "Task_Completed_Rename", "Task_Rewarded_Share_Photo",
            "Task_Rewarded_Multiplay", "Task_Rewarded_Gender", "Task_Completed_Share_Photo",
            "Task_Completed_Gender", "Task_Rewarded_Rename", "Task_Completed_Multiplay",
            "Task_Completed_Birthday"
        ];
        var completeAllTasks = config.mods.core.find(mod => mod.id === "completeAllTasks");
        if (completeAllTasks && completeAllTasks.enabled) {
            taskKeys.forEach(function(key) {
                editor.putInt(key, 1);
            });
        } else {
            taskKeys.forEach(function(key) {
                editor.putInt(key, 0);
            });
        }

        var extraFeatures = config.mods.core.find(mod => mod.id === "extraFeatures");
        if (extraFeatures && extraFeatures.enabled) {
            editor.putInt("Tutorial_Is_Finished", 1);
            editor.putInt("Rated", 1);
            editor.putInt("Setting_Is_Explore", 0);
        } else {
            editor.putInt("Setting_Is_Explore", 1);
        }

        var freeTopUp = config.mods.core.find(mod => mod.id === "freeTopUp");
        if (freeTopUp && freeTopUp.enabled) {
            editor.putInt("Iap__Product_Id", freeTopUp.options.productId);
            editor.putInt("Iap__Purchased", 1);
        }

        // Utility Mods
        var disableAds = config.mods.utility.find(mod => mod.id === "disableAds");
        if (disableAds && disableAds.enabled) {
            editor.putInt("Setting_Is_IAP", 1);
            editor.putInt("IAPed", 1);
        } else {
            editor.putInt("Setting_Is_IAP", 0);
            editor.putInt("IAPed", 0);
        }

        var highPerformance = config.mods.utility.find(mod => mod.id === "highPerformance");
        if (highPerformance && highPerformance.enabled) {
            editor.putInt("Setting_Power_Save", 0);
        } else {
            editor.putInt("Setting_Power_Save", 1);
        }

        var flushCache = config.mods.utility.find(mod => mod.id === "flushCache");
        if (flushCache && flushCache.enabled) {
            clearApplicationCache();
        }

        var debugToast = config.mods.utility.find(mod => mod.id === "debugToast");
        if (debugToast && debugToast.enabled) {
            WelcomeMsg();
            countModelFiles();
            countPortraitFiles();
            countWorldFolders();
        }

        // Account Security Mods
        var bypassBanMultiplayer = config.mods.accountSecurity.find(mod => mod.id === "bypassBanMultiplayer");
        if (bypassBanMultiplayer && bypassBanMultiplayer.enabled) {
            editor.putInt("Multiplayer__Banned", 0);
        }

        // UI Settings
        if (config.uiSettings.displayCoordinates.enabled) {
            editor.putInt("Setting_Is_Coord", 1);
        } else {
            editor.putInt("Setting_Is_Coord", 0);
        }

        if (config.uiSettings.displaySeason.enabled) {
            editor.putInt("Setting__Period", 1);
        } else {
            editor.putInt("Setting__Period", 0);
        }

        if (config.uiSettings.displayPlayerName.enabled) {
            editor.putInt("Setting_Is_Display_Name", 1);
        } else {
            editor.putInt("Setting_Is_Display_Name", 0);
        }

        if (config.uiSettings.displayClock.enabled) {
            editor.putInt("Setting_Is_Clock", 1);
        } else {
            editor.putInt("Setting_Is_Clock", 0);
        }

        if (config.uiSettings.displayGuides.enabled) {
            editor.putInt("Setting_Is_Guide", 1);
        } else {
            editor.putInt("Setting_Is_Guide", 0);
        }

        // Simpan konfigurasi
        editor.commit();
    } catch (e) {
        showToast("Error applying config: " + e, 1);
    }
}

// initialize: Titik masuk utama untuk menjalankan skrip
function initialize() {
    var packageName = context.getPackageName();
    var targetPackage = "com.pixticle.bokuboku.patch";
    if (packageName === targetPackage) {
        if (checkLoaderValidity()) {
            var config = loadConfig();
            if (config) {
                applyConfig(config);
                for (var noel = 0; noel < 3; noel++) {
                    showToast("[MODS] Patched by AeLL", 1);
                }
            }
        }
    }
}

// Execute main script
initialize();
