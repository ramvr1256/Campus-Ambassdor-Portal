<?php
    // To diasable direct url access
    if ( $_SERVER['REQUEST_METHOD']=='GET' && realpath(__FILE__) == realpath( $_SERVER['SCRIPT_FILENAME'] ) ) {
        header( $_SERVER["SERVER_PROTOCOL"]." 404 Not Found", TRUE, 404 );
        die( header( 'location: ../ambassador/login.html' ) );
    }

    date_default_timezone_set('UTC');



?>
