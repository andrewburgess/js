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
(function ($) {
    "use strict";

    var methods = {
        init: function (options) {
            return this.each(function () {
                var self = $(this),
                    data = self.data('tableCRUD');

                if (!data) {
                    var settings = $.extend({
                        tableElement: $('.crud-table'),
                        modalElement: $('.crud-dialog'),
                        modalOptions: {show: false, backdrop: 'static'},
                        saveButton: '#save',
                        editElements: '.edit',
                        deleteElements: '.delete',
                        addButton: '.add',
                        addSuccess: '_addSuccess',
                        editSuccess: '_editSuccess',
                        deleteSuccess: '_deleteSuccess'
                    }, options);

                    data = {options: settings}
                    self.data('tableCRUD', data);
                }

                data.options.modalElement.modal(data.options.modalOptions);
                data.options.modalElement.on('hide', function() {
                    $(document).off('submit');
                });

                $(data.options.addButton).click(function (e) {
                    e.preventDefault();
                    var url = $(this).attr('href');
                    data.options.modalElement.load(url, function () {
                        $(this).modal('show');
                        self.tableCRUD('_setupModal', data.options.addSuccess);
                    });
                });

                self.tableCRUD('_setupCallbacks');
            });
        },
        _addSuccess: function(ret) {
            var self = $(this),
                data = self.data('tableCRUD');

            var newEl = $(ret.Content);
            data.options.tableElement.append(newEl);
            self.tableCRUD('_setupCallbacks');
        },
        _editSuccess: function (ret, extra) {
            var self = $(this),
                data = self.data('tableCRUD');
            
            var updated = $(ret.Content);
            extra.element.replaceWith(updated);
            self.tableCRUD('_setupCallbacks');
        },
        _deleteSuccess: function (ret, extra) {
            var self = $(this),
                data = self.data('tableCRUD');

            extra.element.remove();
        },
        _postData: function (url, values, onSuccess, successData) {
            var self = $(this),
                data = self.data('tableCRUD');

            $.post(url, values, function (ret) {
                data.options.modalElement.find(data.options.saveButton).button('reset');
                if (ret.Success) {
                    data.options.modalElement.modal('hide');
                    data.options.modalElement.html('');
                    if (typeof onSuccess === 'string') {
                        self.tableCRUD(onSuccess, ret, successData);
                    } else {
                        onSuccess(ret, successData);
                    }
                } else {
                    data.options.modalElement.html(ret.Content);
                    Watkins.setBootstrapValidationErrors();
                    self.tableCRUD('_setupModal', onSuccess, successData);
                }
            });
        },
        _setupCallbacks: function() {
            var self = $(this),
                data = self.data('tableCRUD'),
                options = data.options;

            options.tableElement.find(options.editElements).off('click').on('click', function(e) {
                e.preventDefault();

                var url = $(this).attr('href');
                var tr = $($(this).closest('tr'));
                options.modalElement.load(url, function () {
                    $(this).modal('show');
                    self.tableCRUD('_setupModal', options.editSuccess, { element: tr });
                });
            });

            options.tableElement.find(options.deleteElements).off('click').on('click', function(e) {
                e.preventDefault();

                var url = $(this).attr('href');
                var tr = $($(this).closest('tr'));
                options.modalElement.load(url, function () {
                    $(this).modal('show');
                    self.tableCRUD('_setupModal', options.deleteSuccess, { element: tr });
                });
            });
        },
        _setupModal: function (onSuccess, successData) {
            var self = $(this),
                data = self.data('tableCRUD');

            var form = data.options.modalElement.find('form');
            var saveButton = data.options.modalElement.find(data.options.saveButton);

            $.validator.unobtrusive.parse($(form));

            saveButton.click(function (e) {
                e.preventDefault();

                if (form.valid())
                    form.submit();
            });

            $(document).one('submit', form, function (e) {
                e.preventDefault();
                saveButton.button('loading');

                var values = form.serialize();
                self.tableCRUD('_postData', form.attr('action'), values, onSuccess, successData);
            });
        }
    };

    $.fn.tableCRUD = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tableCRUD');
        }
    };
} (jQuery));