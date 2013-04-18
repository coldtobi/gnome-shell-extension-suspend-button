//
// Hides the Gnome "top bar" except in overview mode.
// https://extensions.gnome.org/extension/545/hide-top-bar/
// https://github.com/mlutfy/hidetopbar
//
// See README for more information.
//

const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Settings = imports.misc.extensionUtils.getCurrentExtension()
                    .imports.convenience.getSettings();
                    
const PANEL_ACTOR = Main.panel.actor;
const PANEL_BOX = PANEL_ACTOR.get_parent();

let _panelHeight = PANEL_ACTOR.get_height();
let _showEvent = 0;
let _hideEvent = 0;
let _stgsEvent = 0;
let _stgsEvent2 = 0;

let _enterEvent = 0;
let _leaveEvent = 0;
let _menuEvent = 0;
let _blockerMenu = 0;

function _hidePanel(animationTime) {
    /* Still looking for some kind of "size-changed" event, see issue #12. */
    _panelHeight = PANEL_ACTOR.get_height();
    
    let hotCornerSetting = Settings.get_boolean('hot-corner');
    let x = Number(hotCornerSetting)
    PANEL_BOX.height = x;
    
    Tweener.addTween(PANEL_ACTOR, {
        y: x - _panelHeight,
        time: animationTime,
        transition: 'easeOutQuad',
        onComplete: function() {
            Main.panel._centerBox.hide();
            Main.panel._rightBox.hide();
        
            els = Main.panel._leftBox.get_children();
            for each(el in els.slice(1)) {
                if(typeof(el._cotainer) == "undefined") el.hide();
                else el._container.hide();
            }
            
            PANEL_ACTOR.set_opacity(x*255);
        }
    });
}

function _showPanel(animationTime) {
    PANEL_BOX.height = _panelHeight;
    PANEL_ACTOR.set_opacity(255);
    Main.panel._centerBox.show();
    Main.panel._rightBox.show();
    
    els = Main.panel._leftBox.get_children();
    for each(el in els.slice(1)) {
        if(typeof(el._cotainer) == "undefined") el.show();
        else el._container.show();
    }
    
    Tweener.addTween(PANEL_ACTOR, {
        y: 0,
        time: animationTime,
        transition: 'easeOutQuad',
    });
}

function _handleMenus() {
    if(!Main.overview.visible) {
        blocker = (Main.panel._menus || Main.panel.menuManager)._activeMenu
        if(blocker == null) {
            _hidePanel(Settings.get_double('animation-time-autohide'));
        } else {
            _blockerMenu = blocker
            _menuEvent = _blockerMenu.connect('open-state-changed', function(menu, open){
                if(!open) {
                    _blockerMenu.disconnect(_menuEvent);
                    _menuEvent = 0; _blockerMenu = 0;
                    _handleMenus();
                }
            });
        }
    }
}

function _toggleMouseSensitive() {
    if(Settings.get_boolean('mouse-sensitive')) {
        _enterEvent = PANEL_ACTOR.connect('enter-event', function() {
            _showPanel(Settings.get_double('animation-time-autohide'));
        });
        _leaveEvent = PANEL_ACTOR.connect('leave-event', _handleMenus);
    } else {
        if(_enterEvent) PANEL_ACTOR.disconnect(_enterEvent);
        if(_leaveEvent) PANEL_ACTOR.disconnect(_leaveEvent);
    }
}

function init() { }

function enable() {    
    Main.layoutManager.removeChrome(PANEL_BOX);
    Main.layoutManager.addChrome(PANEL_BOX, { affectsStruts: false });
    
    _showEvent = Main.overview.connect('showing', function() {
        _showPanel(Settings.get_double('animation-time-overview'));
    });
    _hideEvent = Main.overview.connect('hiding', function() {
        _hidePanel(Settings.get_double('animation-time-overview'));
    });
    _stgsEvent = Settings.connect('changed::hot-corner', function() { _hidePanel(0.1); });
    
    _stgsEvent2 = Settings.connect('changed::mouse-sensitive', _toggleMouseSensitive);
    _toggleMouseSensitive();
    
    _hidePanel(0.1);
}

function disable() {
    Main.layoutManager.removeChrome(PANEL_BOX);
    Main.layoutManager.addChrome(PANEL_BOX, { affectsStruts: true});
    
    if(_showEvent) Main.overview.disconnect(_showEvent);
    if(_hideEvent) Main.overview.disconnect(_hideEvent);
    if(_stgsEvent) Settings.disconnect(_stgsEvent);
    if(_stgsEvent2) Settings.disconnect(_stgsEvent2);
    if(_enterEvent) PANEL_ACTOR.disconnect(_enterEvent);
    if(_leaveEvent) PANEL_ACTOR.disconnect(_leaveEvent);
    
    _showPanel(0.1);
}
