Hi,

We have made this application for displaying on a touchscreen with a resolution of 1024x768px.

We have set these tweak settings fot Firefox 3.0.7 for the best experience:

* Disable draging of images
   1. In a new tab type about:config
   2. In the filter field type "nglayout.enable_drag_images"
   3. Double-click on the entry so the value is "false"
   4. Close the tab (no restart needed)

* Disable print dialogue
   1. In a new tab type about:config
   2. Add the boolean "print.always_print_silent";
   3. Set this boolean type to "true"
   
* Disabele Fullscreen top bar
   1. Download and install the Firefox addon at http://addons.mozilla.org/en-US/firefox/addon/2108
   2. Add script from http://userstyles.org/styles/6472 or add the code in this addon:
   
@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);

#fullscr-toggler {

min-height: 0px !important;

height: 0px !important;

max-height: 0px !important;

border: 0 !important;

margin: -0.5px 0 -1.2px 0 !important; padding: 0 !important;

}
	
	3. Test Fullscreen by pressing F11

* Disable image rect on select images
   1. In a new tab type about:config
   2. In the filter field type "browser.display.focus_ring_width"
   3. Double-click on the entry and change the value to "0"
   
   todo:
   max 3x printen
