function createFormLogic (execlib, applib, jqueryelementslib, formvalidationlib) {
  'use strict';

  var lib = execlib.lib,
    jQueryFormLogicMixin = jqueryelementslib.mixins.form.Logic,
    InputListener = jqueryelementslib.helpers.InputListener,
    WebElement = applib.getElementType('WebElement'),
    FormValidatorMixin = formvalidationlib.mixins.FormValidator;

  function FormInputListener (form, input) {
    InputListener.call(this, input);
    this.form = form;
  }
  lib.inherit(FormInputListener, InputListener);
  FormInputListener.prototype.destroy = function () {
    this.form = null;
    InputListener.prototype.destroy.call(this);
  };
  FormInputListener.prototype.onChange = function (ev) {
    this.form.processFieldChange(this.input);
  };

  function FormLogic (id, options) {
    WebElement.call(this, id, options);
    jQueryFormLogicMixin.call(this, options);
    FormValidatorMixin.call(this, options);
    this.formInputListeners = [];
    this.inputValidities = new lib.Map();
    this.data = null;
  }
  lib.inherit(FormLogic, WebElement);
  jQueryFormLogicMixin.addMethods(FormLogic);
  FormValidatorMixin.addMethods(FormLogic);
  FormLogic.prototype.__cleanUp = function () {
    this.data = null;
    if (this.inputValidities) {
      this.inputValidities.destroy();
    };
    this.inputValidities = null;
    if (lib.isArray(this.formInputListeners)) {
      lib.arryDestroyAll(this.formInputListeners);
    }
    this.formInputListeners = null;
    FormValidatorMixin.prototype.destroy.call(this);
    jQueryFormLogicMixin.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };
  FormLogic.prototype.set_data = function (data) {
    this.data = data;
    this.traverseFormFields(inputSetter.bind(null, data));
    data = null;
  };
  function inputSetter (data, el) {
    var val = data[el.attr('name')] || '';
    el.val(val);
  }
  FormLogic.prototype._prepareField = function (fld) {
    this.formInputListeners.push(new FormInputListener(this, fld));
  };
  FormLogic.prototype.initializeForm = function () {
    jQueryFormLogicMixin.prototype.initialize.call(this);
    this.validateInputs();
  };
  FormLogic.prototype.validateInputs = function () {
    if (!lib.isArray(this.formInputListeners)) {
      return;
    }
    this.set('valid', this.formInputListeners.every(this.inputListenerIsValid.bind(this)));
  };
  FormLogic.prototype.inputListenerIsValid = function (listener) {
    var input = null;
    if (!(listener && listener.input)) {
      return false;
    }
    return this.inputIsValid(listener.input);
  };
  FormLogic.prototype.processFieldChange = function (input) {
    var name = input.attr('name'), val = input.val(), upd = {};
    upd[name] = val;
    this.set('data', lib.extend({}, this.get('data'), upd));
    this.validateInputs();
  };
  FormLogic.prototype.inputIsValid = function (input) {
    var val = input.val(), name = input.attr('name');
    /*
    if (!lib.isVal(val)) {
      return false;
    }
    if (lib.isString(val) && val.length<1) {
      return false;
    }
    return true;
    */
    return this.validateFieldNameWithValue(name, val);
  };
  FormLogic.prototype.postInitializationMethodNames = WebElement.prototype.postInitializationMethodNames.concat(['initializeForm']);


  applib.registerElementType('FormLogic', FormLogic);



  var BasicModifier = applib.BasicModifier;

  function FormLogicSubmitModifier (options) {
    BasicModifier.call(this, options);
  }

  lib.inherit (FormLogicSubmitModifier, BasicModifier);
  FormLogicSubmitModifier.prototype.destroy = function () {
    BasicModifier.prototype.destroy.call(this);
  };

  FormLogicSubmitModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var elements = options.elements;
    var submitid = name+'Submit',
      path,
      elementdesc = lib.extend({}, {
        name : submitid,
        type : 'WebElement'
      }, this.config);

    elements.push (elementdesc);
    submitid = elementdesc.name;
    path = '.'+submitid;

    links.push ({
      source : path+'.$element!click',
      target : '.>fireSubmit'
    },
    {
      source : '.:valid',
      target : submitid+'.$element:attr.disabled',
      filter : this._decideDisabled.bind(this)
    });

    switch (this.getConfigVal('actualon')){
      case 'none':
        break;
      case 'always' : {
        links.push ({
          source : '.:actual',
          target : path+':actual',
        });
        break;
      }
      default : 
      case 'valid' : {
        logic.push ({
          triggers : [ '.:valid, .:actual' ],
          references : path+', .',
          handler : function (submit, form) {
            submit.set('actual', form.get('valid') && form.get('actual'));
          }
        });
        break;
      }
    }

    switch (this.getConfigVal('enabledon')){
      case 'none':
        break;
      case 'always' : {
        links.push ({
          source : '.:actual',
          target : path+':enabled',
        });
        break;
      }
      default : 
      case 'valid' : {
        logic.push ({
          triggers : [ '.:valid, .:actual' ],
          references : path+', .',
          handler : function (submit, form) {
            submit.set('enabled', form.get('valid') && form.get('actual'));
          }
        });
        break;
      }
    }
  };
  FormLogicSubmitModifier.prototype._decideDisabled = function (valid) {
    return valid ? undefined : 'disabled';
  };

  FormLogicSubmitModifier.ALLOWED_ON = ['FormLogic'];
  FormLogicSubmitModifier.prototype.DEFAULT_CONFIG = function () {
    return {
      actualon : 'valid'
    };
  };

  applib.registerModifier ('FormLogic.submit', FormLogicSubmitModifier);


}
module.exports = createFormLogic;
