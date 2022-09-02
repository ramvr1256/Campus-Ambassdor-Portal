<?php
    // To diasable direct url access
    if ( $_SERVER['REQUEST_METHOD']=='GET' && realpath(__FILE__) == realpath( $_SERVER['SCRIPT_FILENAME'] ) ) {
        header( $_SERVER["SERVER_PROTOCOL"]." 404 Not Found", TRUE, 404 );
        die( header( 'location: ../ambassador/login.html' ) );
    }

    date_default_timezone_set('UTC');

    $return = [];

    // fb-init
    require_once 'vendor/autoload.php';
    require __DIR__."/../../../fb_vars.php";

    $fb = new Facebook\Facebook([
        'app_id' => $my_fb_app_id,
        'app_secret' => $my_fb_secret,
        'default_graph_version' => 'v3.3',
    ]);
    $helper = $fb->getJavaScriptHelper();
    try {
        $accessToken = $helper->getAccessToken();
        if (!isset($accessToken)) {
            $return['status'] = "error";
            error_log("No cookie set or no OAuth data could be obtained from cookie.");
            exit(json_encode($return));
        }
        $fb_access_token_val = $accessToken->getValue();
        $response = $fb->get('/me', $fb_access_token_val);
        $me = $response->getGraphUser();
    } catch (\Facebook\Exceptions\FacebookResponseException $e) {
        $return['status'] = "fb-error";
        error_log("Graph returned an error: " . $e->getMessage());
        exit(json_encode($return));
    } catch (\Facebook\Exceptions\FacebookSDKException $e) {
        $return['status'] = "fb-error";
        error_log("Facebook SDK returned an error: " . $e->getMessage());
        exit(json_encode($return));
    }
    $fb_name = $me->getName();
    $fb_id = $me->getId();

    // compulsory inputs
    if ( array_key_exists("name_input", $_POST)
         && array_key_exists("college_name_input", $_POST)
         && array_key_exists("mob_input", $_POST)
         && array_key_exists("email_input", $_POST)
         && array_key_exists("addr1_input", $_POST)
         && array_key_exists("pin_input", $_POST)
         && array_key_exists("dname_input", $_POST)
         && array_key_exists("demail_input", $_POST)
         && array_key_exists("pname_input", $_POST)
         && array_key_exists("pemail_input", $_POST)
         && array_key_exists("past_ex_input", $_POST)
         && array_key_exists("skill_input", $_POST)
        ) {
        $name = $_POST["name_input"];
        $college_name = $_POST["college_name_input"];
        $mob = $_POST["mob_input"];
        $email = $_POST["email_input"];
        $addr = $_POST["addr1_input"];
        $pin = $_POST ["pin_input"];
        $dname = $_POST["dname_input"];
        $demail = $_POST["demail_input"];
        $pname = $_POST["pname_input"];
        $pemail = $_POST["pemail_input"];
        $past_ex = $_POST["past_ex_input"];
        $skill = $_POST["skill_input"];
    } else {
        $return['status'] = "wrong";
        $err = [];
        if (!array_key_exists('name_input', $_POST)) array_push($err, '#name_input');
        if (!array_key_exists('college_name_input', $_POST)) array_push($err, '#college_name_input');
        if (!array_key_exists('mob_input', $_POST)) array_push($err, '#mob_input');
        if (!array_key_exists('email_input', $_POST)) array_push($err, '#email_input');
        if (!array_key_exists('addr1_input', $_POST)) array_push($err, '#addr1_input');
        if (!array_key_exists('pin_input', $_POST)) array_push($err, '#pin_input');
        if (!array_key_exists('dname_input', $_POST)) array_push($err, '#dname_input');
        if (!array_key_exists('demail_input', $_POST)) array_push($err, '#demail_input');
        if (!array_key_exists('pname_input', $_POST)) array_push($err, '#pname_input');
        if (!array_key_exists('pemail_input', $_POST)) array_push($err, '#pemail_input');
        if (!array_key_exists('past_ex_input', $_POST)) array_push($err, '#past_ex_input');
        if (!array_key_exists('skill_input', $_POST)) array_push($err, '#skill_input');
        $return['msg'] = "Params missing";
        $return['erring_elmts_id'] = implode(', ', $err);
        exit(json_encode($return));
    }

    // optional inputs
    if (array_key_exists("addr2_input", $_POST)) {
        $addr .= $_POST["addr2_input"];
    }
    $wa = array_key_exists("whatsapp_input", $_POST) ? $_POST["whatsapp_input"] : null;
    $dno = array_key_exists("dno_input", $_POST) ? $_POST['dno_input'] : null;
    $pno = array_key_exists("pno_input", $_POST) ? $_POST['pno_input'] : null;
    if (empty($wa)) $wa = null; // also includes "0", " ", 0, ...
    if (empty($dno)) $dno = null;
    if (empty($pno)) $pno = null;

    // regex checks, wherever applicable; note: this is not a substitute for parameter binding
    $err = [];
    if (preg_match('/^[a-zA-Z0-9\'\-\.\x20&]+$/', $college_name) !== 1) {
        array_push($err, '#college_name_input');
    }
    if (preg_match('/^(\+?\d{1,4}[- ]?)?\d{10}$/', $mob) !== 1) {
        array_push($err, '#mob_input');
    }
    if ($wa != null && preg_match('/^(\+?\d{1,4}[- ]?)?\d{10}$/', $wa) !== 1) {
        array_push($err, '#whatsapp_input');
    }
    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        array_push($err, '#email_input');
    }
    // address unvalidated
    if (empty($addr)) {
        array_push($err, '#addr1_input');
    }

    if (preg_match('/^[0-9]{6}$/', $pin) !== 1) {
        array_push($err, '#pin_input');
    }
    if (preg_match('/^[a-zA-Z0-9\'\-\.\x20&]+$/', $dname) !== 1) {
        array_push($err, '#dname_input');
    }
    if ($dno != null && preg_match('/^(\+?\d{1,4}[- ]?)?\d{10}$/', $dno) !== 1) {
        array_push($err, '#dno_input');
    }
    if (! filter_var($demail, FILTER_VALIDATE_EMAIL)) {
        array_push($err, '#demail_input');
    }
    if (preg_match('/^[a-zA-Z0-9\'\-\.\x20&]+$/', $pname) !== 1) {
        array_push($err, '#pname_input');
    }
    if ($pno != null && preg_match('/^(\+?\d{1,4}[- ]?)?\d{10}$/', $pno) !== 1) {
        array_push($err, '#pno_input');
    }
    if (! filter_var($pemail, FILTER_VALIDATE_EMAIL)) {
        array_push($err, '#pemail_input');
    }
    // past_ex unvalidated
    if (empty($past_ex)) {
        array_push($err, '#past_ex_input');
    }
    // skill unvalidated
    if (empty($skill)){
        array_push($err, '#skill');
    }
    if (! empty($err)) {
        $return['status'] = "wrong";
        $return['msg'] = "Params missing";
        $return['erring_elmts_id'] = implode(', ', $err);
        exit(json_encode($return));
    }

    // authentication of frontend provided fb-input wrt that of the fb-cookie
    if ($name != $fb_name) {
        $return['status'] = "wrong";
        $return['erring_elmts_id'] = "#name_input";
        error_log("bastard spotted");
        exit(json_encode($return));
    }

    if ($fb_id != $_POST['user_id']) {
        $return['status'] = "wrong";
        $return['erring_elmts_id'] = "";
        $return['msg'] = "INVALID USER";
        error_log("bastard spotted");
        exit(json_encode($return));
    }
    $return['fb-id'] = $fb_id;
    $return['fb-name'] = $fb_name;

    // loading unto mysql db
    require "../../../mysql_vars.php";

    $mysqli = new mysqli($hostname, $username, $password, $dbname);

    if (mysqli_connect_errno()) {
        $return['status'] = "error";
        error_log("Connection failed: " . mysqli_connect_error());
        exit(json_encode($return));
    }

    // check if user already present
    $check_query = "SELECT EXISTS(SELECT 1 FROM `ca` WHERE `userid` = ?) AS 'present'";
    $present = false;
    if ($check_stmt = $mysqli->prepare($check_query)){
        if (!$check_stmt->bind_param("s", $fb_id)){
            $return['status'] = "error";
            error_log("binding check params failed");
            exit(json_encode($return));
        }
        if (!$check_stmt->execute()) {
            $return['status'] = "error";
            error_log("check execution failed");
            exit(json_encode($return));
        }
        $check_stmt->bind_result($check_result);
        while ($check_stmt->fetch()) {
            if ($check_result) {
                $present = true;
            }
        }
    } else {
        $return['status'] = "error";
        error_log("check preparation error: " . $check_stmt->error);
        exit(json_encode($return));
    }
    $check_stmt->close();
    if ($present) {
        $return['status'] = "already present";
        exit(json_encode($return));
    }

    // else add user
    $addr = substr(base64_encode($addr), 0, 1020);
    $past_ex = substr(base64_encode($past_ex), 0, 2040);
    $skill = substr(base64_encode($skill), 0, 2040);

    $query = "INSERT INTO `ca` (`name`, `institute`, `userid`, `mobile`, `whatsapp`, `email`, `addr`, `pincode`, `dname`, `dno`, `demail`, `pname`, `pno`, `pemail`, `past_ex`, `skill`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    if ($stmt = $mysqli->prepare($query)) {
        if (!$stmt->bind_param("ssssssssssssssss", $fb_name, $college_name, $fb_id, $mob, $wa, $email, $addr, $pin, $dname, $dno, $demail, $pname, $pno, $pemail, $past_ex, $skill)) {
            $return['status'] = "error";
            error_log("binding params failed");
            exit(json_encode($return));
        }
        if (!$stmt->execute()) {
            $return['status'] = "error";
            error_log("execution failed");
            exit(json_encode($return));
        }
        $stmt->close();

    } else {
        $return['status'] = "error";
        error_log("preparation error: " . $stmt->error);
        exit(json_encode($return));
    }
    $mysqli->close();

    // finishing
    $return['status'] = "success";
    exit(json_encode($return));
?>
