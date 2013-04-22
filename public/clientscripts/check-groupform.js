/* global $, document */
"use strict";
var groups_validator;

var initValidator = function () {

  groups_validator = $("#groupform").validate({
    rules: {
      id: {
        required: true,
        minlength: 2,
        maxlength: 20,
        alphanumeric: true,
        remote: "/groups/checkgroupname"
      },
      emailPrefix: {
        required: true,
        minlength: 5,
        maxlength: 15,
        alphanumeric: true,
        remote: "/groups/checkemailprefix"
      },
      longName: "required",
      description: "required",
      type: "required"

    },
    messages: {
      id: {
        remote: $.validator.format("Dieser Gruppenname ist bereits vergeben.")
      },
      emailPrefix: {
        remote: $.validator.format("Dieses Präfix ist bereits vergeben.")
      }
    },
    errorElement: "span",
    errorClass: "help-inline error",
    highlight: function (element, errorClass) {
      $(element).parent().addClass("error");
    },
    unhighlight: function (element, errorClass) {
      $(element).parent().removeClass("error");
    }
  });

  groups_validator.form();

  ["#id", "#longName", "#description", "#type", "#emailPrefix"].forEach(function (each) {
    $(each).on("change", function () {
      groups_validator.element(each);
    });
  });
  $.extend($.validator.messages, {
    alphanumeric: "Erlaubt sind nur Zahlen, Buchstaben und der Unterstrich."
  });

};
$(document).ready(initValidator);