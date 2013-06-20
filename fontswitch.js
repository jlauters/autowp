jQuery(document.ready(function($) {

    // font-switch
    $('header').append(
        '<div id="font-switch" style="position: absolute; top: 0; left: 300px; background: #666; text-align: center; margin: 0 auto; color: #fff; width: 50%;">' +
            '<a href="javascript:void(0);" style="position: relative: top: 0; right: 0; padding-right: 5px; float: right;">[ X ]</a>' +
            '<h2>Font Switch</h2>' +
            '<div id="controls" style="display: inline;">' +
                '<span style="padding-right: 2%;"><input type="radio" name="font" value="cuprum" checked /> Cuprum</span>' +
                '<span style="padding-right: 2%;"><input type="radio" name="font" value="fauna" /> Fauna One</span>' +
                '<span style="padding-right: 2%;"><input type="radio" name="font" value="merriweather" /> Merriweather Sans</span>' +
                '<span><input type="radio" id="font" name="font" value="glegoo" /> Glegoo</span>' +
            '</div>' +
        '</div>'
    );

    // set our default font
    $('input[name="font"]').first().prop('checked', true);

    // listener
    $('#controls > span').click(function() {
        var selected_font = $('input[name="font"]:checked').val();

        if('cuprum' == selected_font) {
            $('body').css('font-family', '"Cuprum", Helvetica, sans-serif');
        } else if('fauna' == selected_font) {
            $('body').css('font-family', '"Fauna One", serif');
        } else if('merriweather' == selected_font) {
            $('body').css('font-family', '"Merriweather Sans", sans-serif');
        } else if('glegoo' == selected_font) {
            $('body').css('font-family', '"Glegoo", serif');
        }
    }); 

});
