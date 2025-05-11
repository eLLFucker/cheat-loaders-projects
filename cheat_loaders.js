// init dipanggil langsung saat eval di dalam Java.perform
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

    // debug: mencetak pesan ke Logcat dengan tag "MODS"
    function debug(msg) {
        Log.d("MODS", msg);
    }

    // showToast: menampilkan pesan toast di layar
    function showToast(message, length) {
        var len = length || 0;
        var msgStr = JString.$new(message);
        Toast.makeText(context, msgStr, len).show();
    }

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
            debug('MD5 error: ' + e);
            return null;
        }
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
            debug('Delete error: ' + e);
        }
    }

    // clearCache: menghapus seluruh folder cache aplikasi
    function clearCache() {
        var dir = File.$new(context.getExternalCacheDir().getAbsolutePath());
        if (dir.exists()) deleteRecursive(dir);
        debug('Cache cleared');
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

            showToast('[MODS] Default config copied ✅');
        } catch (e) {
            debug('Fetch config error: ' + e);
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
            return JSON.parse(json.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''));
        } catch (e) {
            debug('JSON parse error: ' + e);
            return null;
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

    // mediaAlert: memutar suara peringatan jika integritas dilanggar
    function mediaAlert() {
        if (!mediaPlayer) mediaPlayer = MediaPlayer.$new();
        else mediaPlayer.reset();
        var fd = assetManager.openFd('idiot.mp3');
        mediaPlayer.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
        mediaPlayer.prepare();
        mediaPlayer.setLooping(true);
        mediaPlayer.start();
        setTimeout(function() {
            if (mediaPlayer.isPlaying()) mediaPlayer.stop();
            mediaPlayer.reset();
        }, 3600000);
    }

    // applyConfig: terjemahkan config ke SharedPreferences
    function applyConfig(config) {
        var editor = context.getSharedPreferences('com.pixticle.bokuboku.patch.v2.playerprefs', 0).edit();
        var cs = config.customSettings;
        var m = config.mods;
        var ui = config.uiSettings;

        if (cs.playerProfile.playerName.enabled) editor.putString('Account__User_Name', cs.playerProfile.playerName.value);
        if (cs.playerProfile.birthYear.enabled) editor.putInt('Account__Birthday__Year', cap(cs.playerProfile.birthYear.value, 'birthYear'));
        if (cs.economy.candy.enabled) editor.putInt('Candy', cap(cs.economy.candy.value, 'candy'));

        var slotKeys = [
            'Dressing__Data__Slot__Number', 'Data_Slot_Number', 'Doll__Data__Slot__Number',
            'Jukebox__Playlist__Data__Slot__Number', 'Paint__Painting__Data__Slot__Number',
            'Jukebox__Music_Library__Data__Slot__Number', 'Paint__Palette__Data__Slot__Number',
            'Melody__Data__Slot__Number', 'Block__Own__Data__Slot__Number',
            'Block__List__Data__Slot__Number', 'Favorite__Data__Slot__Number',
            'Album_Slot_Number', 'Portrait__Data__Slot__Number', 'Block__Pack__Data__Slot__Number'
        ];
        var slotCount = cs.storage.dataSlots.enabled ? cap(cs.storage.dataSlots.value, 'dataSlots') : 100;
        slotKeys.forEach(function(k) {
            editor.putInt(k, slotCount);
        });

        var tEnabled = m.core.find(function(x) {
            return x.id === 'completeAllTasks';
        }).enabled;
        var taskKeys = [
            'Task_Rewarded_Birthday', 'Task_Completed_Rename', 'Task_Rewarded_Share_Photo',
            'Task_Rewarded_Multiplay', 'Task_Rewarded_Gender', 'Task_Completed_Share_Photo',
            'Task_Completed_Gender', 'Task_Rewarded_Rename', 'Task_Completed_Multiplay',
            'Task_Completed_Birthday'
        ];
        taskKeys.forEach(function(t) {
            editor.putInt(t, tEnabled ? 1 : 0);
        });

        if (m.core.find(function(x) {
                return x.id === 'extraFeatures';
            }).enabled) {
            editor.putInt('Tutorial_Is_Finished', 1);
            editor.putInt('Rated', 1);
            editor.putInt('Setting_Is_Explore', 0);
        }
        var ftu = m.core.find(function(x) {
            return x.id === 'freeTopUp';
        });
        if (ftu.enabled) {
            editor.putInt('Iap__Product_Id', ftu.options.productId);
            editor.putInt('Iap__Purchased', 1);
        }

        if (m.utility.find(function(x) {
                return x.id === 'disableAds';
            }).enabled) {
            editor.putInt('Setting_Is_IAP', 1);
            editor.putInt('IAPed', 1);
        }
        if (m.utility.find(function(x) {
                return x.id === 'highPerformance';
            }).enabled) editor.putInt('Setting_Power_Save', 0);
        if (m.utility.find(function(x) {
                return x.id === 'flushCache';
            }).enabled) clearCache();

        if (m.accountSecurity.find(function(x) {
                return x.id === 'bypassBanMultiplayer';
            }).enabled) editor.putInt('Multiplayer__Banned', 0);

        Object.keys(ui).forEach(function(k) {
            editor.putInt('Setting__' + k.charAt(0).toUpperCase() + k.slice(1), ui[k].enabled ? 1 : 0);
        });

        editor.commit();
        debug('Config applied and saved');
    }

    // Main logic langsung di init tanpa Java.perform
    debug('Starting script by ' + META.author);
    debug('Loader release: ' + META.release);
    var pkg = context.getPackageName();
    if (pkg !== 'com.pixticle.bokuboku.patch') return debug('Package mismatch');
    var libDir = context.getApplicationInfo().nativeLibraryDir.value;
    var loaderPath = libDir + '/libnoelcheats.so';
    debug('Verifying loader at ' + loaderPath);
    var md5 = calculateMD5(loaderPath);
    if (!md5) {
        debug('Loader missing');
        showToast('[MODS] Loader not found ❌', 1);
        return;
    }
    if (md5 !== '043f789f459219397127b4ff97cd9b2b') {
        debug('MD5 mismatch: found ' + md5);
        showToast('[MODS] Loader unverified ❌', 1);
        return;
    }
    showToast('[MODS] Loader verified ✅');
    showToast('[MODS] Hello World from GitHub');
    debug('Loader valid, loading cheats');
    var cfg = loadConfig();
    if (!cfg) return debug('Config load failed');
    verifyMetadata(cfg.metadata);
    applyConfig(cfg);
    debug('Displaying developer toast');
    for (var i = 0; i < 3; i++) showToast('[MODS] Patched by AeLL', 1);
}

// Panggil fungsi init
init();
