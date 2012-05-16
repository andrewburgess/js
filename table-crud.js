/*
    table-crud.js
    
    jQuery plugin to enable table CRUD actions along with Bootstrap modal dialogs
    
    To Use:
    Expects a table element with this structure
    <table class='.crud-table'>
        <tr>
            <td>Data</td>
            <td>Data</td>
            <td>
                <a href='/path/to/edit/id' class='edit'>Edit</a>
                <a href='/path/to/delete/id' class='delete'>Delete</a>
            </td>
        </tr>
    </table>
    
    Also expects the add/edit/delete urls to return HTML for a modal dialog with a save button
    
*/
// Generic CRUD table handler plugin
; (function ($, window, undefined) {
    "use strict";

    var pluginName = 'tableCRUD',
        document = window.document,
        defaults = {
            tableElement: '.crud-table',
            modalElement: '.crud-dialog',
            modalOptions: { show: false, backdrop: 'static' },
            saveButton: '#save',
            addButton: '.add',
            editElements: '.edit',
            deleteElements: '.delete',
            addSuccess: undefined,
            editSuccess: undefined,
            deleteSuccess: undefined,
            setupModalCallback: undefined
        };

    function TableCRUD(element, options) {
        this.element = element;

        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    TableCRUD.prototype.init = function () {
        var self = this,
            options = this.options;

        $(options.modalElement).modal(options.modalOptions);
        $(options.modalElement).on('hide', function () {
            $(options.modalElement).off('submit');
            $(options.modalElement).off('keypress');
        });
        $(options.modalElement).on('shown', function () {
            $(options.modalElement).keypress(function (event) {
                if (event.which == 13 && event.target.nodeName != 'TEXTAREA')
                    $(options.modalElement).find(options.saveButton).click();
            });
        });

        $(options.addButton).click(function (e) {
            e.preventDefault();

            var url = $(this).attr('href');
            $(options.modalElement).load(url, function () {
                $(this).modal('show');
                self._setupModal(options.addSuccess === undefined ? function (data, extra) { self._addSuccess(data, extra) } : options.addSuccess);
            });
        });

        self._setupCallbacks();
    };

    TableCRUD.prototype._addSuccess = function (data, extra) {
        var newEl = $(data.Content);
        $(this.options.tableElement).append(newEl);
    };

    TableCRUD.prototype._editSuccess = function (data, extra) {
        var updated = $(data.Content);
        extra.element.replaceWith(updated);
    };

    TableCRUD.prototype._deleteSuccess = function (data, extra) {
        extra.element.remove();
    };

    TableCRUD.prototype._postData = function (url, values, onSuccess, successData) {
        var self = this,
            options = this.options;

        $.post(url, values, function (data) {
            $(options.modalElement).find(options.saveButton).button('reset');
            if (data.Success) {
                $(options.modalElement).modal('hide').html('');
                onSuccess(data, successData);
                self._setupCallbacks();
            } else {
                $(options.modalElement).html(data.Content);
                Watkins.setBootstrapValidationErrors();
                self._setupModal(onSuccess, successData);
            }
        });
    };

    TableCRUD.prototype._setupCallbacks = function () {
        var self = this,
            options = this.options;

        $(options.tableElement).find(options.editElements).off('click').on('click', function (e) {
            e.preventDefault();

            var btn = $(this);
            btn.button('loading');

            var url = $(this).attr('href');
            var tr = $($(this).closest('tr'));
            $(options.modalElement).load(url, function () {
                btn.button('reset');
                $(this).modal('show');
                self._setupModal(options.editSuccess === undefined ? self._editSuccess : options.editSuccess, { element: tr });
            });
        });

        $(options.tableElement).find(options.deleteElements).off('click').on('click', function (e) {
            e.preventDefault();

            var url = $(this).attr('href');
            var tr = $($(this).closest('tr'));
            $(options.modalElement).load(url, function () {
                $(this).modal('show');
                self._setupModal(options.deleteSuccess === undefined ? self._deleteSuccess : options.deleteSuccess, { element: tr });
            });
        });
    };

    TableCRUD.prototype._setupModal = function (onSuccess, successData) {
        var self = this,
            options = this.options;

        var form = $(options.modalElement).find('form');
        var saveButton = $(options.modalElement).find(options.saveButton);

        saveButton.click(function (e) {
            e.preventDefault();

            if (form.valid())
                form.submit();
            else
                Watkins.setBootstrapValidationErrors();
        });

        $(document).one('submit', form, function (e) {
            e.preventDefault();

            saveButton.button('loading');

            var values = form.serialize();
            self._postData(form.attr('action'), values, onSuccess, successData);
        });

        if (options.setupModalCallback !== undefined) {
            options.setupModalCallback();
        }

        $.validator.unobtrusive.parse($(form));
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new TableCRUD(this, options));
            }
        });
    }
} (jQuery, window));