// Informasi detail mengenai author dan mods yang akan ditampilkan di log
var infoText = "\n----  Informasi Author  ----\n" +
    "Author   : @AeLL\n" +
    "Tiktok   : @ellmdz19\n" +
    "YouTube  : @noelnoskill\n" +
    "----  Informasi Mods  ----\n" +
    "Release  : 15-04-2025\n" +
    "V-Game   : 1.0.280 (176)\n" +
    "Loader   : FGLA v16.7\n" +
    "License  : Apache License 2.0\n";

// Log awal bahwa script telah mulai berjalan
debug("Script CheatLoader mulai dijalankan.");
debug(infoText);

// ------------------------------------------------------------------
// Inisialisasi dan deklarasi kelas-kelas Java yang diperlukan
// ------------------------------------------------------------------
var packageName = context.getPackageName();
var targetPackage = "com.pixticle.bokuboku.patch";

// Kelas-kelas untuk keperluan manipulasi file dan MD5
var File = Java.use("java.io.File");
var FileInputStream = Java.use("java.io.FileInputStream");
var FileOutputStream = Java.use("java.io.FileOutputStream");
var InputStreamReader = Java.use("java.io.InputStreamReader");
var BufferedReader = Java.use("java.io.BufferedReader");
var MessageDigest = Java.use("java.security.MessageDigest");

// SharedPreferences untuk menyimpan data konfigurasi
var prefName = "com.pixticle.bokuboku.patch.v2.playerprefs";
var prefs = context.getSharedPreferences(prefName, 0);
var editor = prefs.edit();

// Inisialisasi MediaPlayer untuk sound alert
var MediaPlayer = Java.use("android.media.MediaPlayer");
var assetManager = context.getAssets();
var mediaPlayer = null; // Inisialisasi di sini untuk penggunaan ulang

// ------------------------------------------------------------------
// Fungsi untuk menghitung MD5 dari file
// ------------------------------------------------------------------
function calculateFileMD5(filePath) {
    try {
        var file = File.$new(filePath);
        if (!file.exists()) {
            debug("File tidak ditemukan: " + filePath);
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
        debug("Error menghitung MD5: " + err);
        return null;
    }
}

// ------------------------------------------------------------------
// Pengecekan MD5 untuk file loader
// ------------------------------------------------------------------
var expectedMD5 = "22395bfed3914b610f9b5093c21df7e1"; // Ganti dengan MD5 yang benar
var libraryDir = context.getApplicationInfo().nativeLibraryDir.value;
var loaderPath = libraryDir + "/libxcheatsloaders.so";

debug("Memeriksa MD5 file loader: " + loaderPath);
var calculatedMD5 = calculateFileMD5(loaderPath);
var isLoaderValid = false;

if (calculatedMD5 === null) {
    debug("Gagal menghitung MD5 file loader: File tidak ditemukan.");
    showToast("Gagal memverifikasi file loader: File tidak ditemukan!", 1);
} else if (calculatedMD5 !== expectedMD5) {
    debug("MD5 tidak cocok! Diharapkan: " + expectedMD5 + ", Ditemukan: " + calculatedMD5);
    showToast("File loader tidak valid", 1);
} else if (calculatedMD5 == expectedMD5) {
    debug("MD5 file loader valid: " + calculatedMD5);
    showToast("[MODS] File loader verified ✅", 0);
    isLoaderValid = true;
}

// ------------------------------------------------------------------
// Fungsi untuk memainkan sound alert
// ------------------------------------------------------------------
function playSound() {
    debug("Memainkan sound alert: you are an idiot");
    try {
        if (mediaPlayer === null) {
            mediaPlayer = MediaPlayer.$new();
        } else {
            mediaPlayer.reset(); // Reset untuk penggunaan ulang
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
                mediaPlayer.reset(); // Reset, bukan release, untuk penggunaan ulang
                debug("Sound alert dihentikan.");
            }, 15000);
        });
    } catch (err) {
        showToast("Error memainkan sound: " + err, 1);
        debug("Error saat memainkan sound: " + err);
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghapus folder atau file secara rekursif
// ------------------------------------------------------------------
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
        var result = fileOrDir.delete();
        debug("Menghapus " + fileOrDir.getAbsolutePath() + " : " + (result ? "BERHASIL" : "GAGAL"));
    } catch (e) {
        debug("Error menghapus file/direktori: " + e);
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghapus cache aplikasi
// ------------------------------------------------------------------
function clearCache() {
    debug("Memulai proses clear cache.");
    try {
        var cacheDir = File.$new(context.getExternalCacheDir().getAbsolutePath());
        if (cacheDir.exists()) {
            deleteRecursive(cacheDir);
            debug("Cache folder berhasil dihapus: " + cacheDir.getAbsolutePath());
        } else {
            debug("Cache folder tidak ditemukan.");
        }
    } catch (e) {
        debug("Error saat clear cache: " + e);
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghitung file model pada data game
// ------------------------------------------------------------------
function countModelFiles() {
    debug("Memulai pengecekan file model.");
    try {
        var storagePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Save/Model/";
        var targetDir = File.$new(storagePath);
        if (!targetDir.exists() || !targetDir.isDirectory()) {
            throw new Error("❌ Folder model tidak ditemukan!");
        }
        var files = targetDir.listFiles();
        if (files === null) {
            throw new Error("❌ Tidak bisa membaca isi folder!");
        }
        var count = 0;
        for (var cx = 0; cx < files.length; cx++) {
            var fileName = files[cx].getName();
            if (/^Model__\d+\.txt$/.test(fileName)) {
                count++;
            }
        }
        var message = count + " Skin Model Loaded";
        debug("Model files count: " + count);
        showToast("[DEBUG] " + message, 0);
        return count;
    } catch (err) {
        debug("Error pada countModelFiles: " + err.message);
        return 0;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghitung file portrait pada data game
// ------------------------------------------------------------------
function countPortraitFiles() {
    debug("Memulai pengecekan file portrait.");
    try {
        var storagePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Save/Portrait/";
        var targetDir = File.$new(storagePath);
        if (!targetDir.exists() || !targetDir.isDirectory()) {
            throw new Error("❌ Folder portrait tidak ditemukan!");
        }
        var files = targetDir.listFiles();
        if (files === null) {
            throw new Error("❌ Tidak bisa membaca isi folder!");
        }
        var count = 0;
        for (var cx = 0; cx < files.length; cx++) {
            var fileName = files[cx].getName();
            if (/^Portrait__\d+\.txt$/.test(fileName)) {
                count++;
            }
        }
        var message = count + " Portrait Loaded";
        debug("Portrait files count: " + count);
        showToast("[DEBUG] " + message, 0);
        return count;
    } catch (err) {
        debug("Error pada countPortraitFiles: " + err.message);
        return 0;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghitung folder world pada data game
// ------------------------------------------------------------------
function countWorldFiles() {
    debug("Memulai pengecekan folder World.");
    try {
        var baseWPath = context.getExternalFilesDir(null).getAbsolutePath() + "/Save/Creation/World/";
        var worldDir = File.$new(baseWPath);
        if (!worldDir.exists() || !worldDir.isDirectory()) {
            throw new Error("❌ Direktori World tidak ditemukan!");
        }
        var directoryList = worldDir.listFiles();
        if (directoryList === null) {
            throw new Error("❌ Gagal membaca isi direktori!");
        }
        var folderCount = 0;
        for (var i = 0; i < directoryList.length; i++) {
            if (directoryList[i].isDirectory()) {
                folderCount++;
            }
        }
        var resultMessage = folderCount + " World Folder Loaded";
        debug("World folder count: " + folderCount);
        showToast("[DEBUG] " + resultMessage, 0);
        return folderCount;
    } catch (error) {
        debug("Error pada countWorldFiles: " + error.message);
        return 0;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menyalin default config dari asset ke direktori target
// ------------------------------------------------------------------
function copyDefaultConfig(configPath) {
    debug("Menyalin default config ke " + configPath);
    try {
        var inputStream = assetManager.open("default_config/cheats_config.json");
        var reader = BufferedReader.$new(InputStreamReader.$new(inputStream));
        var outputFile = File.$new(configPath);
        var outputStream = FileOutputStream.$new(outputFile);
        var line;
        var newLine = Java.use("java.lang.String").$new("\n");
        while ((line = reader.readLine()) !== null) {
            var bytes = Java.use("java.lang.String").$new(line + newLine).getBytes();
            outputStream.write(bytes);
        }
        reader.close();
        outputStream.close();
        debug("Default config berhasil disalin.");
        showToast("[MODS] Default config copied ✅", 0);
    } catch (err) {
        debug("Error pada copyDefaultConfig: " + err);
        showToast("Error copyDefaultConfig: " + err, 1);
        throw err;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghapus komentar pada string JSON
// ------------------------------------------------------------------
function removeComments(jsonString) {
    debug("Menghapus komentar pada string JSON config.");
    return jsonString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
}

// ------------------------------------------------------------------
// Fungsi untuk membaca dan memvalidasi konfigurasi cheat
// ------------------------------------------------------------------
function getConfig() {
    debug("Memulai proses pembacaan config.");
    try {
        var basePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Mods/CheatLoaders/";
        var configPath = basePath + "cheats_config.json";
        var baseFolder = File.$new(basePath);
        var configFile = File.$new(configPath);
        if (!baseFolder.exists()) {
            if (!baseFolder.mkdirs()) {
                throw new Error("Gagal membuat folder config.");
            }
            debug("Folder base config tidak ditemukan, berhasil dibuat.");
        }
        if (!configFile.exists()) {
            debug("Config file tidak ditemukan, menyalin default config.");
            copyDefaultConfig(configPath);
        }
        var fileReader = Java.use("java.io.FileReader").$new(configFile);
        var bufferedReader = BufferedReader.$new(fileReader);
        var jsonString = "";
        var line;
        while ((line = bufferedReader.readLine()) !== null) {
            jsonString += line + "\n";
        }
        bufferedReader.close();
        var cleanJson = removeComments(jsonString);
        var config = JSON.parse(cleanJson);

        // Validasi metadata
        var originalValues = {
            "author": "AeLL",
            "tiktok": "@ellmdz19",
            "youtube": "@noelnoskill"
        };
        if (config.metadata.author !== originalValues.author ||
            config.metadata.socialMedia.tiktok !== originalValues.tiktok ||
            config.metadata.socialMedia.youtube !== originalValues.youtube) {
            playSound();
            debug("Pelanggaran integritas config: Metadata telah diubah.");
            throw new Error("Idiot mencoba mengubah metadata asli di config.json!😹😹😹");
        }

        debug("Config berhasil dibaca dan valid.");
        return config;
    } catch (err) {
        debug("Error pada getConfig: " + err);
        showToast("" + err, 1);
        return null;
    }
}

// ------------------------------------------------------------------
// Fungsi Utility: Membatasi nilai numerik
// ------------------------------------------------------------------
function limitNumericValue(value, fieldName) {
    var maxInt32 = 2147483647;
    var cappedValue = value;

    // Khusus untuk candy: batasi ke 999999 jika melebihi 1 juta
    if (fieldName === "candy" && value > 1000000) {
        cappedValue = 999999;
        debug("Nilai candy " + value + " melebihi 1 juta, dibatasi ke 999999.");
    }
    // Batasi semua nilai ke max int32
    if (cappedValue > maxInt32) {
        cappedValue = maxInt32;
        debug("Nilai " + fieldName + " " + value + " melebihi batas int32, dibatasi ke " + maxInt32 + ".");
    }
    return cappedValue;
}

// ------------------------------------------------------------------
// Fungsi untuk menerapkan konfigurasi cheat ke SharedPreferences
// ------------------------------------------------------------------
function loadCheats() {
    debug("Memulai penerapan config.");
    var config = getConfig();
    if (!config) {
        debug("Penerapan config gagal karena config tidak tersedia.");
        showToast("Error: Config gagal dimuat", 0);
        return;
    } else {
        debug("Config berhasil dimuat.");
        showToast("[MODS] CONFIG Loaded ✅", 0);
    }

    try {
        // Kustomisasi Pengaturan (customSettings)
        if (config.customSettings.playerProfile.playerName.enabled) {
            editor.putString("Account__User_Name", config.customSettings.playerProfile.playerName.value);
            debug("Custom Player Name diterapkan: " + config.customSettings.playerProfile.playerName.value);
        }
        if (config.customSettings.playerProfile.birthYear.enabled) {
            var birthYear = limitNumericValue(config.customSettings.playerProfile.birthYear.value, "birthYear");
            editor.putInt("Account__Birthday__Year", birthYear);
            debug("Custom Birth Year diterapkan: " + birthYear);
        }
        if (config.customSettings.economy.candy.enabled) {
            var candy = limitNumericValue(config.customSettings.economy.candy.value, "candy");
            editor.putInt("Candy", candy);
            debug("Custom Candy diterapkan: " + candy);
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
            var dataSlots = limitNumericValue(config.customSettings.storage.dataSlots.value, "dataSlots");
            slotKeys.forEach(function(key) {
                editor.putInt(key, dataSlots);
                debug("Custom slot diterapkan untuk " + key + ": " + dataSlots);
            });
        } else {
            slotKeys.forEach(function(key) {
                editor.putInt(key, 100);
                debug("Slot default diterapkan untuk " + key + ": 100");
            });
        }

        // Fitur Core (mods.core)
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
                debug("Task " + key + " diselesaikan (1).");
            });
        } else {
            taskKeys.forEach(function(key) {
                editor.putInt(key, 0);
                debug("Task " + key + " direset (0).");
            });
        }

        var extraFeatures = config.mods.core.find(mod => mod.id === "extraFeatures");
        if (extraFeatures && extraFeatures.enabled) {
            editor.putInt("Tutorial_Is_Finished", 1);
            editor.putInt("Rated", 1);
            editor.putInt("Setting_Is_Explore", 0);
            debug("Extra Features diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Explore", 1);
            debug("Extra Features dinonaktifkan.");
        }

        var freeTopUp = config.mods.core.find(mod => mod.id === "freeTopUp");
        if (freeTopUp && freeTopUp.enabled) {
            editor.putInt("Iap__Product_Id", freeTopUp.options.productId);
            editor.putInt("Iap__Purchased", 1);
            debug("Free Top Up diaktifkan dengan product id: " + freeTopUp.options.productId);
        }

        // Fitur Utility (mods.utility)
        var disableAds = config.mods.utility.find(mod => mod.id === "disableAds");
        if (disableAds && disableAds.enabled) {
            editor.putInt("Setting_Is_IAP", 1);
            editor.putInt("IAPed", 1);
            debug("Disable Ads diaktifkan.");
        } else {
            editor.putInt("Setting_Is_IAP", 0);
            editor.putInt("IAPed", 0);
            debug("Disable Ads dinonaktifkan.");
        }

        var highPerformance = config.mods.utility.find(mod => mod.id === "highPerformance");
        if (highPerformance && highPerformance.enabled) {
            editor.putInt("Setting_Power_Save", 0);
            debug("Mode Performa diaktifkan.");
        } else {
            editor.putInt("Setting_Power_Save", 1);
            debug("Mode Performa dinonaktifkan.");
        }

        var flushCache = config.mods.utility.find(mod => mod.id === "flushCache");
        if (flushCache && flushCache.enabled) {
            clearCache();
            debug("Clear cache dieksekusi.");
        }

        var debugToast = config.mods.utility.find(mod => mod.id === "debugToast");
        if (debugToast && debugToast.enabled) {
            countModelFiles();
            countPortraitFiles();
            countWorldFiles();
            debug("Debug toast ditampilkan.");
        }

        // Fitur Account Security (mods.accountSecurity)
        var bypassBanMultiplayer = config.mods.accountSecurity.find(mod => mod.id === "bypassBanMultiplayer");
        if (bypassBanMultiplayer && bypassBanMultiplayer.enabled) {
            editor.putInt("Multiplayer__Banned", 0);
            debug("Bypass ban multiplayer diaktifkan.");
        }

        // Fitur Antarmuka Pengguna (uiSettings)
        if (config.uiSettings.displayCoordinates.enabled) {
            editor.putInt("Setting_Is_Coord", 1);
            debug("Tampilkan koordinat diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Coord", 0);
            debug("Tampilkan koordinat dinonaktifkan.");
        }

        if (config.uiSettings.displaySeason.enabled) {
            editor.putInt("Setting__Period", 1);
            debug("Tampilkan periode (musim) diaktifkan.");
        } else {
            editor.putInt("Setting__Period", 0);
            debug("Tampilkan periode (musim) dinonaktifkan.");
        }

        if (config.uiSettings.displayPlayerName.enabled) {
            editor.putInt("Setting_Is_Display_Name", 1);
            debug("Tampilkan nama pemain diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Display_Name", 0);
            debug("Tampilkan nama pemain dinonaktifkan.");
        }

        if (config.uiSettings.displayClock.enabled) {
            editor.putInt("Setting_Is_Clock", 1);
            debug("Tampilkan jam diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Clock", 0);
            debug("Tampilkan jam dinonaktifkan.");
        }

        if (config.uiSettings.displayGuides.enabled) {
            editor.putInt("Setting_Is_Guide", 1);
            debug("Tampilkan panduan interaksi diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Guide", 0);
            debug("Tampilkan panduan interaksi dinonaktifkan.");
        }

        // Simpan seluruh konfigurasi ke SharedPreferences
        editor.commit();
        debug("Konfigurasi berhasil diterapkan dan disimpan.");
    } catch (e) {
        debug("Error saat menerapkan config: " + e);
        showToast("Error applyConfig: " + e, 1);
    }
}

// Logika utama program
if (packageName === targetPackage) {
    debug("Package name cocok, memeriksa validitas loader...");
    if (isLoaderValid) {
        debug("Loader valid, menjalankan program utama...");
        // Panggil fungsi untuk memuat dan menerapkan konfigurasi cheat
        loadCheats();

        // Tampilkan Toast Developer
        debug("Menampilkan developer toast: [MODS] Patched by AeLL");
        for (var ellgntng = 0; ellgntng < 3; ellgntng++) {
            showToast("[MODS] Patched by AeLL", 1);
        }
    } else {
        debug("Loader tidak valid, program tidak dijalankan.");
    }
} else {
    debug("Package name tidak cocok, program selesai.");
}
