var FB_LOADED = false;

function finished_rendering() {
    $("#fbspinner").hide();
}

$(function () {
    $.ajaxSetup({cache: true});
    $.getScript("https://connect.facebook.net/en_US/sdk.js", function () {
        FB.init({
            appId: '1722352191243948',
            cookie: true,
            xfbml: true,
            status: true,
            version: 'v3.3'
        });

        FB_LOADED = true;

        FB.getLoginStatus(function (response) {
            if (response.status === 'connected') {
                FB.api('/me', {fields: 'name'}, function (response) {
                    var name_input = $("#name_input");
                    name_input.val(response.name);
                    name_input.addClass("fb-filled");
                    name_input.trigger("input");
                });
            }
        });

        FB.AppEvents.logPageView();

        FB.Event.subscribe('xfbml.render', finished_rendering);

        FB.Event.subscribe('auth.login', function (response) {
            if (response.status === 'connected') {
                FB.api('/me', {fields: 'name'}, function (response) {   // fields: comma sep list
                    var name_input = $("#name_input");
                    name_input.val(response.name);
                    name_input.addClass("fb-filled");
                    name_input.trigger("input");

                    // var email_input = $("#email_input");
                    // email_input.val(response.email);
                    // email_input.addClass("fb-filled");
                    // email_input.trigger("input");
                });
            } else {
                console.log("Fb auth login fired without connected status");
            }
        });

        FB.Event.subscribe('auth.logout', function (response) {
            var name_input = $("#name_input");
            name_input.val("");
            name_input.removeClass("fb-filled");
            name_input.trigger("input");

            // var email_input = $("#email_input");
            // email_input.val("");
            // email_input.removeClass("fb-filled");
            // email_input.trigger("input");
        });
    });
});
