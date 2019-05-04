<?php // vim: set ts=8 sw=4 sts=4 et ai:

if (strlen(@$_POST['words'])) {
    $words = array();
    foreach (explode("\n", $_POST['words']) as $word) {
        $word = preg_replace('/^\\s+|\\s+\$|#.*/', '', $word);
        if ($word) {
            array_push($words, $word);
        }
    }
    if (count($words)) {
        $fp = fopen('../words/www-data.txt', 'a');
        $now = strftime('%Y-%m-%d %H:%M:%S');
        fwrite($fp, "\n# $now: {$_SERVER[REMOTE_ADDR]}\n\n");
        foreach ($words as $word) {
            fwrite($fp, "$word\n");
        }
        fclose($fp);
        echo "<h1>Dankjewel!</h1>\n";
        exit;
    }
}

?>
<h1>Voeg woorden toe</h1>
<form method="post">
<textarea name="words" cols="28" rows="20">
</textarea>
<input type="submit"/>
</form>
