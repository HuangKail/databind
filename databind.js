var DataBind = (function (){
    var databoundSelector = 'databound' + (~new Date()).toString(16).substr(0, 5);
    var dataBindObjPrototype = $.extend({
        set: function (name, val, fromEle) {
            var propName, prop, isDiff;
            if (val == this.__prop[name]){
                return ;
            }
            else if (typeof val == 'object' &&
                     Object.prototype.toString.call(val) !== '[object Array]'){
                prop = this.__prop[name];
                isDiff = false;
                for (propName in val){
                    if (val.hasOwnProperty(propName)){
                        if (!prop || !prop[propName] || val[propName] != prop[propName]){
                            isDiff = true;
                            break;
                        }
                    }
                }
                if (!isDiff){
                    return ;
                }
            }
            this.__preProp[name] = this.__prop[name];
            this.__prop[name] = val;
            if (!fromEle){
                this.dispatchEvent('set:'+name, {
                    data: val,
                    fromEle: fromEle
                });
            }
        },
        get: function (name){
            return this.__prop[name];
        },
        appendTo: function (ele) {
            this.$el.appendTo(ele);
        }
    }, events);

    var boundMap = {
        style: {
            handler: function ($el) {
                return function (evt){
                    $el.css(evt.data);
                };
            },
            bind: function (obj, name, $el, $root, initValue) {
                var handler = this.handler($el);
                if (initValue) {
                    handler({
                        data: initValue
                    });
                    obj.__prop[name] = initValue;
                }
                obj.addEventListener('set:' + name, handler);
            }
        },
        src: {
            handler: function ($el) {
                return function (evt){
                    $el[0].src = evt.data;
                };
            },
            bind: function (obj, name, $el, $root, initValue) {
                var handler = this.handler($el);
                if (initValue) {
                    handler({
                        data: initValue
                    });
                    obj.__prop[name] = initValue;
                }
                obj.addEventListener('set:' + name, handler);
            }
        },
        dualTxt: {
            getHandler: function ($el) {
                return function (evt){
                    if (!evt.fromEle){
                        $el.val(evt.data);
                    }
                };
            },
            setHandler: function (obj, name) {
                function finish (evt) {
                    obj.set(name, obj.__inputVal);
                    obj.__inputVal = '';
                    obj.__keyupTimer = null;
                }
                return function (evt){
                    if (obj.__keyupTimer) {
                        clearTimeout(obj.__keyupTimer);
                    }
                    else{
                        obj.dispatchEvent('typing:'+name);
                    }
                    obj.__keyupTimer = setTimeout(finish, 200);
                    obj.__inputVal = evt.target.value;
                }
            },
            bind: function (obj, name, $el, $root, initValue) {
                var getHandler = this.getHandler($el);
                obj.addEventListener('set:' + name, getHandler);
                $el.bind('keyup', this.setHandler(obj, name));
                if (initValue){
                    getHandler({
                        data: initValue
                    });
                    obj.__prop[name] = initValue;
                }
            }
        },
        txt: {
            handler: function ($el) {
                return function (evt){
                    $el.text(evt.data);
                };
            },
            bind: function (obj, name, $el, $root, initValue) {
                var handler = this.handler($el);
                obj.addEventListener('set:' + name, handler);
                if (initValue){
                    handler({
                        data: initValue
                    });
                    obj.__prop[name] = initValue;
                }
            }
        },
        cls: {
            handler: function (name, $el) {
                return function (evt) {
                    if (this.__preProp[name]){
                        $el.removeClass(this.__preProp[name]);
                    }
                    $el.addClass(evt.data);
                };
            },
            bind: function (obj, name, $el, $root, initValue) {
                var handler = this.handler(name, $el)
                obj.addEventListener('set:' + name, handler);
                if (initValue){
                    handler({
                        data: initValue
                    });
                    obj.__prop[name] = initValue;
                }
            }
        },
        click: {
            handler: function (obj, name) {
                return function (evt){
                    obj.dispatchEvent('click:' + name);
                }
            },
            bind: function (obj, name, $el, $root) {
                var handler = this.handler(obj, name);

                $el.addClass(databoundSelector + '-' + name);
                if ($el == $root){
                    $root.bind('click', handler);
                }
                else{
                    $root.delegate('.' + databoundSelector + '-' + name, 'click', handler);
                }
            }
        },
        mouseenter: {
            handler: function (obj, name) {
                return function (evt) {
                    obj.dispatchEvent('mouseenter:' + name);
                }
            },
            bind: function (obj, name, $el, $root) {
                var handler = this.handler(obj, name);
                $el.addClass(databoundSelector + '-' + name);

                if ($el == $root){
                    $root.bind('mouseenter', handler);
                }
                else{
                    $root.delegate('.' + databoundSelector + '-' + name, 'mouseenter', handler);
                }
            }
        },
        mouseleave: {
            handler: function (obj, name) {
                return function (evt) {
                    obj.dispatchEvent('mouseleave:' + name);
                }
            },
            bind: function (obj, name, $el, $root) {
                var handler = this.handler(obj, name);
                $el.addClass(databoundSelector + '-' + name);

                if ($el == $root){
                    $root.bind('mouseleave', handler);
                }
                else{
                    $root.delegate('.' + databoundSelector + '-' + name, 'mouseleave', handler);
                }
            }
        }
    }
    function bindProperties (properties) {
        var property, i = 0,
            bindName, bindType, retProperties = [];

        while (property = properties[i++]){
            property = property.split(':');
            bindName = property[0];
            bindType = property[1];

            if (!bindType || !bindName){
                continue;
            }
            retProperties.push({
                type: bindType,
                name: bindName
            });
        }
        return retProperties.length ? retProperties : null;
    }
    function doBinding (idx, ele, initValues) {
        var $el,
            bindPropertyStr,
            properties,
            property,
            i = 0,
            type, name;

        if (this.$el[0] == ele){
            $el = this.$el;
        }
        else{
            $el = $(ele);
        }

        bindPropertyStr = $el.attr('data-bind');
        properties = bindProperties(bindPropertyStr.split(';'));

        while (property = properties[i++]){
            type = property.type;
            name = property.name;

            if (!boundMap[type]){
                continue;
            }
            boundMap[type].bind(this, name, $el, this.$el, initValues && initValues[name]);
        }
    }
    function doBindingWithObj (obj, initValues) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            args.push(initValues);
            doBinding.apply(obj, args);
            // obj = null;
            // initValues = null;
        };
    }
    function dataBind (el, initValues) {
        var $el, $dataBounds,
            view,
            doBindingSelf;

        $el = $(el);

        view = $.extend({
            $el: $el,
            __prop: {},
            __preProp: {}
        }, dataBindObjPrototype);

        $dataBounds = $el.find('[data-bind]');

        doBindingSelf = doBindingWithObj(view, initValues);
        $dataBounds.each(doBindingSelf);
        doBindingSelf(0, $el[0]);

        return view;
    }
    function mixin (additionalBoundMap) {
        $.extend(boundMap, additionalBoundMap);
    }
    return {
        bind: dataBind,
        mixinBoundMap: mixin
    };
})();