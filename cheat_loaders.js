// Main CodeExecution
function init() {
    // ---- Import Java Classes ----
    var File = Java.use('java.io.File');
    var FileInputStream = Java.use('java.io.FileInputStream');
    var FileOutputStream = Java.use('java.io.FileOutputStream');
    var MessageDigest = Java.use('java.security.MessageDigest');
    var BufferedReader = Java.use('java.io.BufferedReader');
    var FileReader = Java.use('java.io.FileReader');
    var Toast = Java.use('android.widget.Toast');
    var Log = Java.use('android.util.Log');
    var MediaPlayer = Java.use('android.media.MediaPlayer');
    var JString = Java.use('java.lang.String');

    var assetManager = context.getAssets();
    var mediaPlayer = null;

    // ---- Informasi Metadata ----
    var META = {
        author: "noelnavernoe",
        tiktok: "@navernoel",
        youtube: "@noelnoskill",
        release: "04-05-2025",
        version: "1.0.28x",
        loaderVersion: "FG & LA v16.7",
        license: "Apache License 2.0"
    };

    // calculateMD5: menghitung nilai MD5 dari file
    function calculateMD5(path) {
        try {
            var file = File.$new(path);
            if (!file.exists()) return null;

            var digest = MessageDigest.getInstance('MD5');
            var stream = FileInputStream.$new(file);
            var buffer = Java.array('byte', new Array(8192).fill(0));
            var read;
            while ((read = stream.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }
            stream.close();

            var hashArray = digest.digest();
            var result = '';
            for (var i = 0; i < hashArray.length; i++) {
                var hex = (hashArray[i] & 0xff).toString(16);
                if (hex.length === 1) hex = '0' + hex;
                result += hex;
            }
            return result;
        } catch (e) {
            Log.e('MODS', e.toString());
            return null;
        }
    }

    // removeComments: menghapus komentar pada string JSON
    function removeComments(jsonString) {
        return jsonString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
    }

    // deleteRecursive: menghapus file/folder secara rekursif
    function deleteRecursive(file) {
        try {
            if (file.isDirectory()) {
                var files = file.listFiles() || [];
                files.forEach(deleteRecursive);
            }
            file.delete();
        } catch (e) {
            Log.e('MODS', e.toString());
        }
    }

    // clearCache: menghapus seluruh folder cache aplikasi
    function clearCache() {
        var dir = File.$new(context.getExternalCacheDir().getAbsolutePath());
        if (dir.exists()) deleteRecursive(dir);
        Log.i('MODS', 'Cache cleared');
    }

    // cap: membatasi nilai numeric untuk mencegah overflow
    function cap(val, field) {
        var capped = val;
        if (field === 'candy' && val > 1000000) capped = 999999;
        return capped > 2147483647 ? 2147483647 : capped;
    }

    // fetchDefaultConfig: mengunduh config default dari GitHub
    function fetchDefaultConfig(path) {
        try {
            var url = 'https://raw.githubusercontent.com/eLLFucker/cheat-loaders-projects/refs/heads/main/default_config.json';
            var content = fetchUrlRawText(url);
            if (!content) throw new Error('Fetch failed');

            var file = File.$new(path);
            var out = FileOutputStream.$new(file);
            out.write(JString.$new(content).getBytes());
            out.close();

            showToast('[MODS] Default config copied ✅', 0);
        } catch (e) {
            Log.e('MODS', e.toString());
            showToast('Error copyDefaultConfig: ' + e, 1);
            throw e;
        }
    }

    // loadConfig: memuat dan mem-parse cheats_config.json
    function loadConfig() {
        var base = context.getExternalFilesDir(null).getAbsolutePath() + '/Mods/cheatLoader/';
        var path = base + 'cheats_config.json';
        var Dir = File.$new(base);
        if (!Dir.exists() && !Dir.mkdirs()) throw new Error('Cannot create config folder');

        var file = File.$new(path);
        if (!file.exists()) fetchDefaultConfig(path);

        var reader = BufferedReader.$new(FileReader.$new(file));
        var json = '';
        var line;
        while ((line = reader.readLine()) !== null) json += line + '\n';
        reader.close();

        try {
            return JSON.parse(removeComments(json));
        } catch (e) {
            Log.e('MODS', e.toString());
            showToast('JSON parse error: ' + e, 1);
            return null;
        }
    }

    // mediaAlert: memutar suara peringatan jika integritas dilanggar
    function mediaAlert() {
        try {
            if (!mediaPlayer) mediaPlayer = MediaPlayer.$new();
            else mediaPlayer.reset();
            var fd = assetManager.openFd('idiot.mp3');
            mediaPlayer.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
            mediaPlayer.prepare();
            mediaPlayer.setLooping(true);
            mediaPlayer.start();
            Java.scheduleOnMainThread(function() {
                setTimeout(function() {
                    if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                    mediaPlayer.reset();
                }, 3600000);
            });
        } catch (e) {
            showToast('Error playing alert: ' + e, 1);
            Log.e('MODS', e.toString());
        }
    }

    // verifyMetadata: cek metadata di config tidak diubah
    function verifyMetadata(meta) {
        if (
            meta.author !== META.author ||
            meta.socialMedia.tiktok !== META.tiktok ||
            meta.socialMedia.youtube !== META.youtube
        ) {
            mediaAlert();
            throw new Error('Metadata integrity violation');
        }
    }

    // applyConfig: terjemahkan config ke SharedPreferences
    function applyConfig(config) {
        var editor = context.getSharedPreferences('com.pixticle.bokuboku.patch.v2.playerprefs', 0).edit();
        var cs = config.customSettings;
        var m = config.mods;
        var ui = config.uiSettings;

        // PlayerProfile
        if (cs.playerProfile.playerName.enabled) {
            editor.putString('Account__User_Name', cs.playerProfile.playerName.value);
        } else {
            // do nothing: keep existing value
        }
        if (cs.playerProfile.birthYear.enabled) {
            editor.putInt('Account__Birthday__Year', cap(cs.playerProfile.birthYear.value, 'birthYear'));
        } else {
            // do nothing
        }

        // Economy
        if (cs.economy.candy.enabled) {
            editor.putInt('Candy', cap(cs.economy.candy.value, 'candy'));
        } else {
            // do nothing
        }

        // Data slots
        var slotKeys = [
            'Dressing__Data__Slot__Number', 'Data_Slot_Number', 'Doll__Data__Slot__Number',
            'Jukebox__Playlist__Data__Slot__Number', 'Paint__Painting__Data__Slot__Number',
            'Jukebox__Music_Library__Data__Slot__Number', 'Paint__Palette__Data__Slot__Number',
            'Melody__Data__Slot__Number', 'Block__Own__Data__Slot__Number',
            'Block__List__Data__Slot__Number', 'Favorite__Data__Slot__Number',
            'Album_Slot_Number', 'Portrait__Data__Slot__Number', 'Block__Pack__Data__Slot__Number'
        ];
        if (cs.storage.dataSlots.enabled) {
            var slotCount = cap(cs.storage.dataSlots.value, 'dataSlots');
            slotKeys.forEach(function(k) {
                editor.putInt(k, slotCount);
            });
        } else {
            // leave defaults
        }

        // Core mods: completeAllTasks
        var completeAll = m.core.find(x => x.id === 'completeAllTasks').enabled;
        var taskKeys = [
            'Task_Rewarded_Birthday', 'Task_Completed_Rename', 'Task_Rewarded_Share_Photo',
            'Task_Rewarded_Multiplay', 'Task_Rewarded_Gender', 'Task_Completed_Share_Photo',
            'Task_Completed_Gender', 'Task_Rewarded_Rename', 'Task_Completed_Multiplay',
            'Task_Completed_Birthday'
        ];
        if (completeAll) {
            taskKeys.forEach(function(t) {
                editor.putInt(t, 1);
            });
        } else {
            taskKeys.forEach(function(t) {
                editor.putInt(t, 0);
            });
        }

        // extraFeatures
        var extra = m.core.find(x => x.id === 'extraFeatures').enabled;
        if (extra) {
            editor.putInt('Tutorial_Is_Finished', 1);
            editor.putInt('Rated', 1);
            editor.putInt('Setting_Is_Explore', 0);
        } else {
            editor.putInt('Setting_Is_Explore', 1);
        }

        // freeTopUp
        var ftu = m.core.find(x => x.id === 'freeTopUp');
        if (ftu.enabled) {
            editor.putInt('Iap__Product_Id', ftu.options.productId);
            editor.putInt('Iap__Purchased', 1);
        } else {
            editor.putInt('Iap__Purchased', 0);
        }

        // Utility mods
        var disableAds = m.utility.find(x => x.id === 'disableAds').enabled;
        if (disableAds) {
            editor.putInt('Setting_Is_IAP', 1);
            editor.putInt('IAPed', 1);
        } else {
            editor.putInt('Setting_Is_IAP', 0);
            editor.putInt('IAPed', 0);
        }

        var highPerf = m.utility.find(x => x.id === 'highPerformance').enabled;
        if (highPerf) {
            editor.putInt('Setting_Power_Save', 0);
        } else {
            editor.putInt('Setting_Power_Save', 1);
        }

        var flush = m.utility.find(x => x.id === 'flushCache').enabled;
        if (flush) {
            clearCache();
        }

        // Account security
        var bypass = m.accountSecurity.find(x => x.id === 'bypassBanMultiplayer').enabled;
        if (bypass) {
            editor.putInt('Multiplayer__Banned', 0);
        } else {
            editor.putInt('Multiplayer__Banned', 1);
        }

        // UI settings
        if (ui.displayCoordinates.enabled) {
            editor.putInt('Setting_Is_Coord', 1);
        } else {
            editor.putInt('Setting_Is_Coord', 0);
        }
        if (ui.displaySeason.enabled) {
            editor.putInt('Setting__Period', 1);
        } else {
            editor.putInt('Setting__Period', 0);
        }
        if (ui.displayPlayerName.enabled) {
            editor.putInt('Setting_Is_Display_Name', 1);
        } else {
            editor.putInt('Setting_Is_Display_Name', 0);
        }
        if (ui.displayClock.enabled) {
            editor.putInt('Setting_Is_Clock', 1);
        } else {
            editor.putInt('Setting_Is_Clock', 0);
        }
        if (ui.displayGuides.enabled) {
            editor.putInt('Setting_Is_Guide', 1);
        } else {
            editor.putInt('Setting_Is_Guide', 0);
        }

        editor.commit();
        Log.i('MODS', 'Config applied and saved');
    }

    // Main logic
    Log.i('MODS', 'Starting script by ' + META.author + ' | TikTok: ' + META.tiktok + ' | YouTube: ' + META.youtube + ' | Loader: ' + META.loaderVersion + ' | License: ' + META.license);
    var pkg = context.getPackageName();
    if (pkg !== 'com.pixticle.bokuboku.patch') return Log.i('MODS', 'Package mismatch');

    var libDir = context.getApplicationInfo().nativeLibraryDir.value;
    var loaderPath = libDir + '/libnoelcheats.so';
    Log.i('MODS', 'Verifying loader at ' + loaderPath);
    var md5 = calculateMD5(loaderPath);
    if (!md5) {
        Log.i('MODS', 'Loader missing');
        showToast('[MODS] Loader not found ❌', 1);
        return;
    }
    if (md5 !== '043f789f459219397127b4ff97cd9b2b') {
        Log.i('MODS', 'MD5 mismatch: found ' + md5);
        showToast('[MODS] Loader unverified ❌', 1);
        return;
    }
    showToast('[MODS] Loader verified ✅', 1);

    Log.i('MODS', 'Loader valid, loading cheats');
    var cfg = loadConfig();
    if (!cfg) return Log.e('MODS', 'Config load failed');
    verifyMetadata(cfg.metadata);
    applyConfig(cfg);

    Log.i('MODS', 'Displaying developer toast');
    for (var i = 0; i < 3; i++) showToast('[MODS] Patched by AeLL', 1);
}

// Panggil fungsi init
init();
