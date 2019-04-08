export class APIHandler {
    constructor({base_url = window.location + 'api/public/'} = {}) {
        this.base_url = base_url;
    }

    request = ({endpoint = 'get_users', method = 'GET', data = '', callback} = {}) => {
        let defer = $.Deferred();
        $.ajax({
            url: this.base_url + endpoint,
            method: method,
            data: data,
            dataType: "json"
        }).done(function(data) {
            if (callback) {
                defer.resolve(callback(data['data']));
            } else {
                defer.resolve(data['data']);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("Error: " + errorThrown);
        });
        return defer.promise();
    }
}