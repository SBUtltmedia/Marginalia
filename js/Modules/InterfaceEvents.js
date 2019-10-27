export class InterfaceEvents {
    constructor(state, users_data, works_data, ui) {
        console.log("InterfaceEvents Module Loaded");

        this.state = state;
        this.users_data = users_data;
        this.works_data = works_data;
        this.ui = ui;
    }

    async click_course_option(event, course) {
        this.state.selected_course = course;
        let users = await this.users_data.get_selected_course_users(course);
        if (!this.ui.populate_users_dropdown(users)) {
            console.error("error while attempting to populate courses dropdown");
        }
        //TODO find a better place to get the selected course
        console.log(course)
        updateSettingPage("", "", course);
        this.ui.clear_work_selection();
    }

    async click_user_option(event, creator) {
        this.state.selected_creator = creator;
        let works = await this.works_data.get_selected_course_works(this.state.selected_course, creator);
        if (!this.ui.populate_works_dropdown(works)) {
            console.error("error while attempting to populate works dropdown");
        }
    }

    async click_work_option(event, work) {
        this.state.selected_work = work;

        /**
         * Show the submenu for the work
         */
        this.ui.show_sub_menu();

        /**
         * TODO: Temporary I guess.
         * Load Work
         */
        selectLit(this.state.selected_creator, this.state.selected_work);

        this.ui.collapse_mode();
    }

    bind_redirect_confirmation(specificElement) {
        $(specificElement).on("click", function (event) {
            if (($(specificElement).attr("href")).indexOf(window.location.host) !== -1) {
                // console.log("do nothing is same host");
            } else if (($(specificElement).attr("href")).indexOf("javascript:void(0);") !== -1) {
                // console.log("do nothing is javascript void event");
            } else if ($(specificElement).attr("href").charAt(0) == "#") {
                // console.log("do nothing is just hash placeholder tag");
            } else {
                event.preventDefault();
                let res = confirm("Are you sure you want to visit the URL:\n\n" + $(specificElement).attr("href"));
                if (res) {
                    window.location = $(specificElement).attr("href");
                } else {
                    return;
                }
            }
        });
    }

    do_course_search() {
        let list = $(".coursesMenu").find("li");
        let search_key = $(".searchCourse").val();

        this.ui.filter_courses_dropdown(list, search_key);
    }
}
