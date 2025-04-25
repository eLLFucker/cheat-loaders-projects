// Informasi detail mengenai author dan mods yang akan ditampilkan di log
var infoText = "\n----  Informasi Author  ----\n" +
    "Author   : @AeLL\n" +
    "Tiktok   : @ellmdz19\n" +
    "YouTube  : @noelnoskill\n" +
    "----  Informasi Mods  ----\n" +
    "Release  : 23-04-2025\n" +
    "V-Game   : 1.0.28x\n" +
    "Loader   : FGLA v16.7\n" +
    "License  : Apache License 2.0\n";

// Log awal bahwa script telah mulai berjalan
debug("[INFO] Script utama mulai dijalankan.");
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
            debug("[WARNING] File tidak ditemukan: " + filePath);
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
        debug("[ERROR] Error menghitung MD5: " + err);
        return null;
    }
}

// ------------------------------------------------------------------
// Pengecekan MD5 untuk file loader
// ------------------------------------------------------------------
var expectedMD5 = "94d23e91fd73de50d0b2d688683f41c7"; // Ganti dengan MD5 yang benar
var libraryDir = context.getApplicationInfo().nativeLibraryDir.value;
var loaderPath = libraryDir + "/libxcheatsloaders.so";

debug("[INFO] Memeriksa MD5 file loader: " + loaderPath);
var calculatedMD5 = calculateFileMD5(loaderPath);
var isLoaderValid = false;

if (calculatedMD5 === null) {
    debug("[INFO] Gagal menghitung MD5 file loader: File not found.");
    showToast("Gagal memverifikasi file loader: File not found!", 1);
} else if (calculatedMD5 !== expectedMD5) {
    debug("[INFO] MD5 tidak cocok! Diharapkan: " + expectedMD5 + ", Ditemukan: " + calculatedMD5);
    showToast("[MODS] File loader unverified ❌", 1);
} else if (calculatedMD5 == expectedMD5) {
    debug("[INFO] MD5 file loader valid: " + calculatedMD5);
    showToast("[MODS] File loader verified ✅", 0);
    isLoaderValid = true;
}

function fakeRamInfo() {
    var activityManager = Java.use("android.app.ActivityManager");
    var memoryInfo = Java.use("android.app.ActivityManager$MemoryInfo");
    var runtimeClass = Java.use("java.lang.Runtime");

    // nilai fake RAM (dalam byte)
    var fakeTotalRam = 24 * 1024 * 1024 * 1024; // 24 GB
    var fakeAvailRam = 20 * 1024 * 1024 * 1024; // 20 GB
    var fakeUsedRam = fakeTotalRam - fakeAvailRam;

    // ActivityManager.getMemoryInfo()
    activityManager.getMemoryInfo.implementation = function (memInfo) {
      this.getMemoryInfo(memInfo);

      memInfo.totalMem.value = fakeTotalRam;
      memInfo.availMem.value = fakeAvailRam;
      memInfo.lowMemory.value = false;

      return;
    };

    // Runtime.getRuntime().totalMemory()
    var runtimeInstance = runtimeClass.getRuntime();
    runtimeInstance.totalMemory.implementation = function () {
      return fakeTotalRam;
    };

    // Runtime.getRuntime().freeMemory()
    runtimeInstance.freeMemory.implementation = function () {
      return fakeAvailRam;
    };

   debug("[MODS] fakeRamInfo aktif: semua sumber RAM dipalsuin ke 24GB total, 20GB available");
   showToast("[MODS] FakeRam Active", 1);
}

// ------------------------------------------------------------------
// Fungsi untuk memainkan sound alert
// ------------------------------------------------------------------
function playSound() {
    debug("[INFO] Memainkan sound alert: you are an idiot");
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
                debug("[INFO] Sound alert dihentikan.");
            }, 15000);
        });
    } catch (err) {
        showToast("Error memainkan sound: " + err, 1);
        debug("[ERROR] Error saat memainkan sound: " + err);
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
        debug("[INFO] Menghapus " + fileOrDir.getAbsolutePath() + " : " + (result ? "BERHASIL" : "GAGAL"));
    } catch (e) {
        debug("[ERROR] Error menghapus file/direktori: " + e);
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghapus cache aplikasi
// ------------------------------------------------------------------
function clearCache() {
    debug("[INFO] Memulai proses clear cache.");
    try {
        var cacheDir = File.$new(context.getExternalCacheDir().getAbsolutePath());
        if (cacheDir.exists()) {
            deleteRecursive(cacheDir);
            debug("[INFO] Cache folder berhasil dihapus: " + cacheDir.getAbsolutePath());
        } else {
            debug("[INFO] Cache folder tidak ditemukan.");
        }
    } catch (e) {
        debug("[ERROR] Error saat clear cache: " + e);
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghitung file model pada data game
// ------------------------------------------------------------------
function countModelFiles() {
    debug("[INFO] Memulai pengecekan file model.");
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
        var message = count + " Model detected";
        debug("[INFO] Model files count: " + count);
        showToast("[DEBUG] " + message, 0);
        return count;
    } catch (err) {
        debug("[ERROR] Error pada countModelFiles: " + err.message);
        return 0;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghitung file portrait pada data game
// ------------------------------------------------------------------
function countPortraitFiles() {
    debug("[INFO] Memulai pengecekan file portrait.");
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
        var message = count + " Portrait detected";
        debug("[INFO] Portrait files count: " + count);
        showToast("[DEBUG] " + message, 0);
        return count;
    } catch (err) {
        debug("[ERROR] Error pada countPortraitFiles: " + err.message);
        return 0;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghitung folder world pada data game
// ------------------------------------------------------------------
function countWorldFiles() {
    debug("[INFO] Memulai pengecekan folder World.");
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
        var resultMessage = folderCount + " World detected";
        debug("[INFO] World folder count: " + folderCount);
        showToast("[DEBUG] " + resultMessage, 0);
        return folderCount;
    } catch (error) {
        debug("[ERROR] Error pada countWorldFiles: " + error.message);
        return 0;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menyalin default config dari asset ke direktori target
// ------------------------------------------------------------------
function copyDefaultConfig(configPath) {
    debug("[INFO] Menyalin default config dari server ke " + configPath);
    try {
        // Fetch content from GitHub using the provided function
        var githubUrl = "https://raw.githubusercontent.com/eLLFucker/cheat-loaders-projects/refs/heads/main/default_config.json";
        var configContent = fetchUrlRawText(githubUrl);

        if (configContent === null) {
            throw new Error("Gagal mengambil config dari server. URL tidak valid atau server tidak merespons.");
        }

        // Create output file
        var outputFile = File.$new(configPath);
        var outputStream = FileOutputStream.$new(outputFile);

        // Write content to file
        var bytes = Java.use("java.lang.String").$new(configContent).getBytes();
        outputStream.write(bytes);

        // Close stream
        outputStream.close();

        debug("[INFO] Default config berhasil disalin menggunakan metode fetch dari server.");
        showToast("[MODS] Default config copied ✅", 0);
    } catch (err) {
        debug("[ERROR] Error pada copyDefaultConfig: " + err);
        showToast("Error copyDefaultConfig: " + err, 1);
        throw err;
    }
}

// ------------------------------------------------------------------
// Fungsi untuk menghapus komentar pada string JSON
// ------------------------------------------------------------------
function removeComments(jsonString) {
    debug("[INFO] Menghapus komentar pada string JSON.");
    return jsonString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");
}

// ------------------------------------------------------------------
// Fungsi untuk membaca dan memvalidasi konfigurasi cheat
// ------------------------------------------------------------------
function getConfig() {
    debug("[INFO] Memulai proses pembacaan config.");
    try {
        var basePath = context.getExternalFilesDir(null).getAbsolutePath() + "/Mods/cheatLoader/";
        var configPath = basePath + "cheats_config.json";
        var baseFolder = File.$new(basePath);
        var configFile = File.$new(configPath);
        if (!baseFolder.exists()) {
            if (!baseFolder.mkdirs()) {
                throw new Error("Gagal membuat folder config.");
            }
            debug("[INFO] Folder base config tidak ditemukan, berhasil dibuat.");
        }
        if (!configFile.exists()) {
            debug("[INFO] File tidak ditemukan, menyalin config default.");
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
            debug("[FUCK YOU] Pelanggaran integritas config: Metadata telah diubah.");
            throw new Error("Idiot mencoba mengubah metadata asli di config.json!😹😹😹");
        }

        debug("[INFO] File berhasil dibaca dan valid.");
        return config;
    } catch (err) {
        debug("[ERROR] Error pada getConfig: " + err);
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
        debug("[INFO] Nilai candy " + value + " melebihi 1 juta, dibatasi ke 999999.");
    }
    // Batasi semua nilai ke max int32
    if (cappedValue > maxInt32) {
        cappedValue = maxInt32;
        debug("[INFO] Nilai " + fieldName + " " + value + " melebihi batas int32, dibatasi ke " + maxInt32 + ".");
    }
    return cappedValue;
}

// ------------------------------------------------------------------
// Fungsi untuk menerapkan konfigurasi cheat ke SharedPreferences
// ------------------------------------------------------------------
function loadCheats() {
    debug("[INFO] Memulai penerapan config.");
    var config = getConfig();
    if (!config) {
        debug("[ERROR] Penerapan config gagal karena config tidak tersedia.");
        showToast("Error: Config gagal dimuat", 0);
        return;
    } else {
        debug("[INFO] Config berhasil dimuat.");
        // showToast("[MODS] CONFIG Loaded ✅", 0);
    }

    try {
        // Kustomisasi Pengaturan (customSettings)
        if (config.customSettings.playerProfile.playerName.enabled) {
            editor.putString("Account__User_Name", config.customSettings.playerProfile.playerName.value);
            debug("[MODS] Custom Player Name diterapkan: " + config.customSettings.playerProfile.playerName.value);
        }
        if (config.customSettings.playerProfile.birthYear.enabled) {
            var birthYear = limitNumericValue(config.customSettings.playerProfile.birthYear.value, "birthYear");
            editor.putInt("Account__Birthday__Year", birthYear);
            debug("[MODS] Custom Birth Year diterapkan: " + birthYear);
        }
        if (config.customSettings.economy.candy.enabled) {
            var candy = limitNumericValue(config.customSettings.economy.candy.value, "candy");
            editor.putInt("Candy", candy);
            debug("[MODS] Custom Candy diterapkan: " + candy);
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
                debug("[MODS] Custom slot diterapkan untuk " + key + ": " + dataSlots);
            });
        } else {
            slotKeys.forEach(function(key) {
                editor.putInt(key, 100);
                debug("[MODS] Slot default diterapkan untuk " + key + ": 100");
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
                debug("[MODS] Task " + key + " diselesaikan (1).");
            });
        } else {
            taskKeys.forEach(function(key) {
                editor.putInt(key, 0);
                debug("[MODS] Task " + key + " direset (0).");
            });
        }

        var extraFeatures = config.mods.core.find(mod => mod.id === "extraFeatures");
        if (extraFeatures && extraFeatures.enabled) {
            editor.putInt("Tutorial_Is_Finished", 1);
            editor.putInt("Rated", 1);
            editor.putInt("Setting_Is_Explore", 0);
            debug("[MODS] Extra Features diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Explore", 1);
            debug("[MODS] Extra Features dinonaktifkan.");
        }

        var freeTopUp = config.mods.core.find(mod => mod.id === "freeTopUp");
        if (freeTopUp && freeTopUp.enabled) {
            editor.putInt("Iap__Product_Id", freeTopUp.options.productId);
            editor.putInt("Iap__Purchased", 1);
            debug("[MODS] Free Top Up diaktifkan dengan product id: " + freeTopUp.options.productId);
        }

        // Fitur Utility (mods.utility)
        var disableAds = config.mods.utility.find(mod => mod.id === "disableAds");
        if (disableAds && disableAds.enabled) {
            editor.putInt("Setting_Is_IAP", 1);
            editor.putInt("IAPed", 1);
            debug("[MODS] Disable Ads diaktifkan.");
        } else {
            editor.putInt("Setting_Is_IAP", 0);
            editor.putInt("IAPed", 0);
            debug("[MODS] Disable Ads dinonaktifkan.");
        }

        var highPerformance = config.mods.utility.find(mod => mod.id === "highPerformance");
        if (highPerformance && highPerformance.enabled) {
            editor.putInt("Setting_Power_Save", 0);
            debug("[MODS] Mode Performa diaktifkan.");
        } else {
            editor.putInt("Setting_Power_Save", 1);
            debug("[MODS] Mode Performa dinonaktifkan.");
        }

        var flushCache = config.mods.utility.find(mod => mod.id === "flushCache");
        if (flushCache && flushCache.enabled) {
            clearCache();
            debug("[MODS] Clear cache dieksekusi.");
        }

        var debugToast = config.mods.utility.find(mod => mod.id === "debugToast");
        if (debugToast && debugToast.enabled) {
            countModelFiles();
            countPortraitFiles();
            countWorldFiles();
            debug("[MODS] Debug toast ditampilkan.");
        }

        // Fitur Account Security (mods.accountSecurity)
        var bypassBanMultiplayer = config.mods.accountSecurity.find(mod => mod.id === "bypassBanMultiplayer");
        if (bypassBanMultiplayer && bypassBanMultiplayer.enabled) {
            editor.putInt("Multiplayer__Banned", 0);
            debug("[MODS] Bypass ban multiplayer diaktifkan.");
        }

        // Fitur Antarmuka Pengguna (uiSettings)
        if (config.uiSettings.displayCoordinates.enabled) {
            editor.putInt("Setting_Is_Coord", 1);
            debug("[MODS] Tampilkan koordinat diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Coord", 0);
            debug("[MODS] Tampilkan koordinat dinonaktifkan.");
        }

        if (config.uiSettings.displaySeason.enabled) {
            editor.putInt("Setting__Period", 1);
            debug("[MODS] Tampilkan periode (musim) diaktifkan.");
        } else {
            editor.putInt("Setting__Period", 0);
            debug("[MODS] Tampilkan periode (musim) dinonaktifkan.");
        }

        if (config.uiSettings.displayPlayerName.enabled) {
            editor.putInt("Setting_Is_Display_Name", 1);
            debug("[MODS] Tampilkan nama pemain diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Display_Name", 0);
            debug("[MODS] Tampilkan nama pemain dinonaktifkan.");
        }

        if (config.uiSettings.displayClock.enabled) {
            editor.putInt("Setting_Is_Clock", 1);
            debug("[MODS] Tampilkan jam diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Clock", 0);
            debug("[MODS] Tampilkan jam dinonaktifkan.");
        }

        if (config.uiSettings.displayGuides.enabled) {
            editor.putInt("Setting_Is_Guide", 1);
            debug("[MODS] Tampilkan panduan interaksi diaktifkan.");
        } else {
            editor.putInt("Setting_Is_Guide", 0);
            debug("[MODS] Tampilkan panduan interaksi dinonaktifkan.");
        }

        // Simpan seluruh konfigurasi ke SharedPreferences
        editor.commit();
        debug("[MODS] Konfigurasi berhasil diterapkan dan disimpan.");
    } catch (e) {
        debug("[ERROR] Error saat menerapkan config: " + e);
        showToast("Error applyConfig: " + e, 1);
    }
}

// Logika utama program
if (packageName === targetPackage) {
    debug("[LIB] Package name cocok, memeriksa validitas loader...");
    if (isLoaderValid) {
        debug("[LIB] Loader valid, menjalankan program utama...");
        // Panggil fungsi untuk memuat dan menerapkan konfigurasi cheat
        loadCheats();
        fakeRamInfo();
        showToast("Hello World from JavaScript", 1);

        // Tampilkan Toast Developer
        debug("[LIB] Menampilkan developer toast: [MODS] Patched by AeLL");
        for (var ellgntng = 0; ellgntng < 3; ellgntng++) {
            showToast("[MODS] Patched by AeLL", 1);
        }
    } else {
        debug("[LIB] Loader tidak valid, program tidak dijalankan.");
    }
} else {
    debug("[LIB] Package name tidak cocok, program selesai.");
            }
