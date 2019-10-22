export class UsersData {
    constructor({ state, api, grouping = '' } = {}) {
        console.log("UsersData Module Loaded");

        this.state = state;
        this.api = api;
        this.grouping = grouping;

        /**
         * Must be called at end of constructor
         */
        return (async () => {
            this.creator_list = await this.get_creators();
            this.current_user = await this.get_current_user();
            return this;
        })();
    }

    async get_selected_course_users(course) {
        let user_list = this.api.request({
            endpoint: 'get_creators_of_course',
            data: {
                course: course,
            },
        });
        return await user_list;
    }

    async get_creators() {
        let user_list = this.api.request({
            endpoint: 'get_creators',
            data: this.grouping,
        });
        return await user_list;
    }

    async get_current_user() {
        let user = this.api.request({
            endpoint: 'get_current_user',
        });
        return await user;
    }

    async get_user_works(eppn) {
        this.selected_user_works = await this.api.request({
            endpoint: 'get_works',
            data: {
                eppn: eppn,
            },
        });
        /* remove '.html' */
        this.selected_user_works.forEach((work, index) => {
            this.selected_user_works[index] = this.selected_user_works[index].substr(0, this.selected_user_works[index].lastIndexOf('\.'));
        });
        return this.selected_user_works;
    }

    async get_course_users() {
        console.log(this.state);
    }
}