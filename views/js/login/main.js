$(function () {
    $("#main-form")[0].addEventListener("submit", function (event) {
        event.preventDefault();
    }, false);
    
    var data = {};
    var ok = {};
    $(".xinput").each(function () {
        ok[$(this).attr('id')] = !$(this).prop('required');
        $(this).on('input', function () {
            let isOk = $(this)[0].validity.valid;
            ok[$(this).attr('id')] = isOk;
            data[$(this).attr('id')] = $(this).val();
            if (isOk) {
                $(this).parent().siblings(".undertext").find(".undertext-error").hide();
                $(this).parent().siblings(".undertext").find(".undertext-info").show();
            }
        });
    });

    // function KeyPress(e) {
    //     var evtobj = window.event? event : e;
    //     if (evtobj.keyCode == 90 && evtobj.ctrlKey && evtobj.shiftKey) {
    //         console.log(JSON.stringify(ok));
    //         console.log(JSON.stringify(data));
    //     }
    // }
    // document.onkeydown = KeyPress;
    
    $("input[type=submit]").click(function () {

        // check if fb is properly connected
        if (FB_LOADED) {
            // check for fb login and permissions
            FB.getLoginStatus(function (response) {
                if (response && !response.error){
                    console.log(response.status);

                    if (response.status === 'connected') {
                        // fb login confirmed, check for permissions
                        let userid = response.authResponse.userID;
                        let permok = true;
                        data['user_id'] = userid;
                        FB.api(`/${userid}/permissions`, function (response) {

                            // iterate over permissions to check if any was denied
                            response.data.forEach(function (item) {
                                if (item.status == 'declined') {
                                    console.log(item);
                                    permok = false;
                                }
                            });

                            if (permok) {
                                // all permissions granted, make sure to have correct details
                                // FB.api('/me', {fields: 'name, email'}, function (response) {
                                FB.api('/me', {fields: 'name'}, function (response) {
                                    let username = response.name;
                                    // let useremail = response.email;

                                    // now check if the remaining form inputs are ok, if so call ajax
                                    let all_finputs_ok = true;
                                    for (const key in ok) {
                                        if (ok.hasOwnProperty(key)) {
                                            if (!ok[key]) {
                                                all_finputs_ok = false;
                                                $("#" + key).parent().siblings(".undertext").find(".undertext-info").hide();
                                                $("#" + key).parent().siblings(".undertext").find(".undertext-error").show();
                                            }
                                        }
                                    }

                                    // send ajax request to server
                                    if (all_finputs_ok) {
                                        // alert("sending ajax");
                                        console.log(userid);
                                        console.log(username);
                                        // console.log(useremail);
                                        console.log(data);
                                        data['name_input'] = username;
                                        $.ajax({
                                            type: "POST",
                                            url: "back/login_manager.php",
                                            data: data,
                                            dataType: "json",
                                            success: function (data) {
                                                if (data['status'] == "success") {
                                                    alert("entry recorded");
                                                    $("#main-form").hide()
                                                    $("#success").show();
                                                } else if (data['status'] = "already present") {
                                                    alert("User already present, signup ignored");
                                                }
                                                else if (data['status'] == "wrong") {
                                                    if (data['msg'] === "Params missing") {
                                                        $(data['erring_elmts_id']).parents().siblings(".undertext").find(".undertext-info").hide();
                                                        $(data['erring_elmts_id']).parents().siblings(".undertext").find(".undertext-error").show();
                                                        alert("some elements did not match expected input format, please correct them and try again");
                                                    } else if (data['msg'] === "INVALID USER") {
                                                        alert("The request couldn't be processed, fb authentication failed.");
                                                    }
                                                } else if (data['status'] == "error" || data['status'] == "fb-error") {
                                                    alert("server error occurred, please try again after some time");
                                                }
                                            },
                                            error: function (data) {
                                                console.log(data);
                                            },
                                        });
                                    } else {
                                        alert("not all fields are valid");
                                    }
                                });
                            } else {
                                alert("It seems you haven't granted us all permissions, please do so to proceed");
                                // ask for remaining permissions
                            }
                        });
                    } else {
                        alert("Your account isn't connected to facebook, please log in (if you have already done so, try logging out and in again)");
                        fb_stuff_ok = false;
                    }
                } else {
                    alert("Couldn't retrieve response from FB. Please try later");
                }
            }, true);
        } else {
            alert("link with facebook could not be established, please try again");
        }
    });
});
