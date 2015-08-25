'use strict';
angular.module('snaptasqApp').controller('MainCtrl', function($scope, $http, $interval, $location, notifications, TaskMarshaler) {
    $scope.top_image = {
        minHeight: "750px",
        paddingTop: "200px"
    }

    $scope.slickSliderImageWidth = "100%";
    $scope.$watch('viewport', function(newVal, oldVal) {
        if (angular.isUndefined(newVal)) return;
        if (newVal == "xs" || newVal == "sm") {
            //mobile
            $scope.slickSliderImageWidth = "100%";
            $scope.top_image = {
                minHeight: "750px",
                paddingTop: "100px"
            };
        } else {
            //desktop, tablet
            $scope.slickSliderImageWidth = "50%";
            $scope.top_image = {
                minHeight: "750px",
                paddingTop: "200px"
            };
        }
    }, true);

    $scope.getStarted = function() {
        //TaskMarshaler.removeTask();
        $location.path("/task/create");
    }
    $scope.handleSearch = function($item, $model, $label) {
        var task = TaskMarshaler.createDefaultTask($item);
        TaskMarshaler.setTask(task);
        $location.path("/task/create");
    }

    $scope.launchTaskCreateWithName = function(taskName) {
        var temp = {
            name: taskName
        };
        var task = TaskMarshaler.createDefaultTask(temp);
        TaskMarshaler.setTask(task);
        $location.path("/task/create");
    }
    $scope.searchTask = "";
    // removed  image: "assets/bubbleHeads/need_kids_pick_up/model.png"}
    $scope.slides = [{
        image: "assets/bubbleHeads/need_ride/model.png"
    }, {
        image: "assets/bubbleHeads/need_a_drink/model.png"
    }, ];
    $scope.commonTasks = [{
        name: "Arts and Crafts"
    }, {
        name: "Assemble Furniture"
    }, {
        name: "Assemble IKEA Furniture"
    }, {
        name: "Bartending"
    }, {
        name: "Bathroom Cleaning"
    }, {
        name: "Baby Sitting"
    }, {
        name: "Cabinet Cleaning"
    }, {
        name: "Carpentry"
    }, {
        name: "Carpentry & Construction"
    }, {
        name: "Carpet Cleaning"
    }, {
        name: "Construction"
    }, {
        name: "Cooking"
    }, {
        name: "Cooking & Baking"
    }, {
        name: "Customized Building"
    }, {
        name: "Decoration Help"
    }, {
        name: "Deep Clean"
    }, {
        name: "Deliver Big Piece of Furniture"
    }, {
        name: "Delivery Service"
    }, {
        name: "Disassemble furniture"
    }, {
        name: "Dog Walking"
    }, {
        name: "Drop Off Donations"
    }, {
        name: "Electrical Work"
    }, {
        name: "Entertain Guests"
    }, {
        name: "Event Decorating"
    }, {
        name: "Event Help & Wait Staff"
    }, {
        name: "Event Marketing"
    }, {
        name: "Event Planning"
    }, {
        name: "Event Staffing"
    }, {
        name: "Floor Cleaning"
    }, {
        name: "Food Run"
    }, {
        name: "Furniture Shopping & Assembly"
    }, {
        name: "Gardening"
    }, {
        name: "General Cleaning"
    }, {
        name: "General Handyman"
    }, {
        name: "General Moving Help"
    }, {
        name: "Graphic Design"
    }, {
        name: "Grocery Shopping"
    }, {
        name: "Hang Pictures"
    }, {
        name: "Heavy Lifting"
    }, {
        name: "Help Cooking & Serving Food"
    }, {
        name: "Help With Dirty Dishes"
    }, {
        name: "Home Cleaning"
    }, {
        name: "Kitchen Cleaning"
    }, {
        name: "Laundry Help"
    }, {
        name: "Light Installation"
    }, {
        name: "Move Furniture"
    }, {
        name: "Organization"
    }, {
        name: "Organize Closet"
    }, {
        name: "Organize Home"
    }, {
        name: "Organize Paperwork"
    }, {
        name: "Organize a Room"
    }, {
        name: "Pack for a Move"
    }, {
        name: "Pet Sitting"
    }, {
        name: "Personal Assistant"
    }, {
        name: "Photography"
    }, {
        name: "Pick Up & Delivery"
    }, {
        name: "Rearrange Furniture"
    }, {
        name: "Remove Furniture"
    }, {
        name: "Remove Heavy Furniture"
    }, {
        name: "Return Items"
    }, {
        name: "Returns"
    }, {
        name: "Run Errands"
    }, {
        name: "Shelf Mounting"
    }, {
        name: "Shop For & Install Decorations"
    }, {
        name: "Shopping"
    }, {
        name: "Shopping Returns"
    }, {
        name: "TV Mounting"
    }, {
        name: "Take Furniture Apart & Move It"
    }, {
        name: "Unpack & Organize"
    }, {
        name: "Usability Testing"
    }, {
        name: "Wait for Delivery"
    }, {
        name: "Wait in Line"
    }, {
        name: "Web Design"
    }, {
        name: "Web Design & Development"
    }, {
        name: "Writing & Editing"
    }, {
        name: "Washing Car"
    }, {
        name: "Yard Work & Removal"
    }];


    $scope.advertisedTasks = [{
        name: "pet sitting",
        prefill: "Need someone to watch Rover for an hour",
        img: "assets/images/panel-images/tasq1.png"
    }, {
        name: "moving",
        prefill: "Need help moving furniture to my new dorm",
        img: "assets/images/panel-images/tasq2.png"
    }, {
        name: "food run",
        prefill: "Can someone bring me ikes to b4",
        img: "assets/images/panel-images/foodRun.png"
    }, {
        name: "dorm cleaning",
        prefill: "Can anyone clean my dorm?",
        img: "assets/images/panel-images/cleaning.png"
    }, {
        name: "shopping & delivery",
        prefill: "I need someone to pick up groceries",
        img: "assets/images/panel-images/tasq5.png"
    }, {
        name: "transportation",
        prefill: "Can anyone pick me up at X",
        img: "assets/images/panel-images/tasq6.png"
    }];

}).controller('MainCarouselCtrl', function($scope) {
    $scope.myInterval = 5000;
    $scope.getActiveSlide = function() {
        return $scope.slides.filter(function(s) {
            return s.active;
        })[0];
    };
    $scope.slides = [{
        text: "tutor me",
        image: "assets/images/stockpics/dark/tutoring.jpg"
    }, {
        text: "do my shopping",
        image: "assets/images/stockpics/dark/groceryShopping.jpg"
    }, {
        text: "pick up my food",
        image: "assets/images/stockpics/dark/foodDelivery.jpg"
    }, {
        text: "walk my dog",
        image: "assets/images/stockpics/dark/dogWalking.jpg"
    }, {
        text: "help me move",
        image: "assets/images/stockpics/dark/moving.jpg"
    }, {
        text: "wash my car",
        image: "assets/images/stockpics/dark/washingCar.jpg"
    }];
});
