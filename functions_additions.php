
/********** Customizations **********
 **********                **********/

function extra_nav_menus() {
    register_nav_menu('footer', __('Footer Menu', 'twentytwelve'));
}
add_action('after_setup_theme', 'extra_nav_menus');

function extra_styles() {
    wp_enqueue_style('font-awesome', get_stylesheet_directory_uri().'/css/font-awesome/css/font-awesome.min.css');
}
add_action('wp_enqueue_scripts', 'extra_styles');

function enqueue_site_scripts() {

}
add_action('wp_footer', 'enqueue_site_scripts');

// custom logout action
function returnHome() {
    wp_redirect(home_url());
    exit;
}
add_action('wp_logout', 'returnHome');

// custom post type registration
function add_custom_post_type() {

}
add_action('init', 'add_custom_post_type');

// custom taxonomies
function add_custom_taxonomy() {

}
add_action('init', 'add_custom_taxonomy', 9);
