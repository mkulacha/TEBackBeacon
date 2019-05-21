/**
 * Contains all the back-end Enum Definitions and their appropriate value mappings; if you use
 * an enum from the back-end, it should exist here and be used from here.
 *
 * Please do:
 *
 *  - Annotate each enum type with a blurb what its about.
 *  - Use names identical to the ones in the back-end.
 *  - Be excellent.
 *
 * @module Enumerations
 **/

define(function () {
    return {
        /** Types of agencies **/
        BusinessTypes: {
            Leisure: 1,
            Corporate: 2,
            Entertainment: 3,
            GroupTravel: 4
        },

        /** Types of client addresses **/
        AddressTypes: {
            Primary: 1,
            Billing: 2,
            Shipping: 3
        },

        /** Types of correspondences for the client **/
        CorrespondenceTypes: {
            Unknown: 0,
            Phone: 1,
            Fax: 2,
            Email: 3
        },

        /** Subtypes of client correspondences, shared by types **/
        CorrespondenceSubTypes: {
            Unknown: 0,
            Home: 1,
            Personal: 2,
            Work: 3,
            Cell: 4,
            Other: 5
        },

        PersonTypes: {
            Unknown: 0,
            Client: 1,
            Companion: 2,
            Traveler: 3,
            Agent: 4
        },

        /** Types of emails that show up in the message/email history. */
        EmailTypes: {
            Unknown: 0,
            ShoreEx: 1,
            Invoice: 2,
            ClientItinerary: 3,
            Air: 4,
            BonVoyage: 5,
            WelcomeHome: 6,
            AirCompare: 7,
            CruiseCompare: 8,
            SystemEmail: 9,
            SupportTicket: 10,
            HotelCompare: 11,
            TravelexRequest: 12,
            ClientStatement: 13,
            UpfrontPlanningFeeEmail: 14
        },

        EmailTemplateTypes: {
            CompareTable: 1,
            ClientItinerary: 2,
            Invoice: 3,
            BonVoyage: 4,
            WelcomeHome: 5,
            ManulifeGlobalMedical: 6,
            ClientStatement: 7,
            UpfrontPlanningFeeEmail: 8
        },

        /** Types of global (not tied to any specific service) quote statuses. */
        QuoteStatusTypes: {
            Draft: 1,
            Sent: 2,
            Booked: 3,
            Invalid: 4,
            PendingExpiry: 5,
            Expired: 6,
            PendingCancel: 7,
            Canceled: 8,
            Closed: 9,
            Quote: 10,
            PartialBooked: 11,
            BookedNoPayment: 12,
            BookedWithPayment: 13,
            ReadyForTravel: 14,
            ActionRequired: 15,
            Traveled: 16
        },

        /** Types of global TE UX Notification types. */
        UXSTATUSENUM: {
            DANGER: 0,
            WARNING: 1,
            SUCCESS: 2,
            INFO: 3
        },

        /** Types of payable object */
        PayableObjectTypes: {
            Balance: 1,
            Deposit: 2
        },

        /** Types of trip service object **/
        TripServiceObjectTypes: {
            Cruise: 1,
            ShoreExcursion: 2,
            Hotel: 3,
            PlanningFee: 4,
            Insurance: 5,
            Air: 6
        },

        /** Types of per-passenger price breakdowns. **/
        PriceBreakdownItemTypes: {
            CruiseFare: 1,
            TaxesAndFees: 2,
            NonCommissionableFee: 3,
            CommissionFee: 4,
            Miscellaneous: 5,
            AirFare: 6,
            AirAddOn: 7,
            OnBoardCredit: 8,
            AncillaryService: 9,
            Insurance: 10,
            PrepaidGratuities: 11,
            PackagesAndTransfers: 12,
            NetRateMarkupFee: 13
        },

        PaymentTypes: {
            //"C" for the credit card in PayPal
            CreditCard: 1,
            Account: 2,
            // Cruise Credit represents manual payment reconciliation made through the system's admin.
            // The Cruise gives extra credit to the booking for various reasons.
            CruiseCredit: 3,
            // Outside Payment represents manual payment reconcilation made through the system's admin.
            // There were payments made outside the system.
            OutsidePayment: 4,
            Cash: 5,
            Cheque: 6,
            Other: 7,
            CorporateCreditCard: 8
        },

        /** Types of results that can come back when payments for travel services are being performed. **/
        PaymentResultTypes: {
            Fail: 0,
            Success: 1,
            NotProcessed: 2,
            RecordPaymentFailed: 3,
            FinanceNotRecorded: 4
        },

        ReconciliationStatusTypes: {
            Resolved: 1,
            Outstanding: 2
        },

        TravelServiceStatusTypes: {
            Offered: 1,
            OnRequest: 2,
            Booked: 3,
            Modified: 4,
            Canceled: 5,
            Deposit: 6,
            Paid: 7,
            Closed: 8,
            PartialPaid: 9,
            Removed: 10,
            Requote: 11,
            SubmittedForTicketing: 12,
            Ticketed: 13,
            ReadyForTicketing: 14,
            PnrChange: 15,
            PendingCancel: 16,
            Reserved: 17,
            PaidWithPoints: 18,
            BookedClientPay: 19,
            Purchased: 20,
            UnderReview: 21,
            BookedReserved: 22,
            BookedNoPay: 23
        },

        /** Types of Travel Services. **/
        TravelServiceTypes: {
            Cruise: 1,
            ShoreExcursions: 2,
            Hotel: 3,
            PlanningFee: 4,
            Insurance: 5,
            Air: 6,
            External: 7
        },

        /** Types of External/Internal Providers used. **/
        ProviderTypes: {
            Amadeus: 1,
            Revelex: 2,
            TravelEdge: 3,
            ShoreExGroup: 4,
            Sabre: 5,
            Manual: 6,
            Tourico: 11,
            HotelBeds: 12,
            Manulife: 14,
            Travco: 17,
            TotalStay: 18
        },

        AirSearchProviders: {
            Amadeus: 1,
            Sabre: 2,
            Multi: 3
        },

        HotelSearchProviders: {
            Multi: 0,
            Sabre: 1,
            HotelBeds: 2,
            Tourico: 3,
            TotalStay: 4,
            Travco: 5,
            KTHotel: 6
        },

        /** Types of Air Itineraries. **/
        AirItineraryTypes: {
            Return: 1,
            OneWay: 2,
            MultiCity: 3
        },

        /** Types of Air Traveller Age Brackets. **/
        AirTravellerTypes: {
            Adult: 1,
            Child: 4,
            Infant: 5,
            LapInfant: 6
        },

        /** Age Cutoffs of Air Traveller Age Brackets. Travelers must be < this age to qualify as this type **/
        AirTravelerAgeCutoffs: {
            Adult: 999, //65
            Child: 12,
            Infant: 2,
            LapInfant: 2
        },

        /** Types of UI "Warning Levels" applicable to the After-Hours Ticketing Team **/
        AirTicketingDeskWarningLevel: {
            Normal: 0,
            Warning: 1,
            InEffect: 2
        },

        /** Cancellation notification before weekend and US holidays **/
        ScheduledInformationalMessageTypes: {
            InformationalCanadianWeekendTicketingHours: 1,
            InformationalUsLongWeekendTicketingHours: 2
        },

        ReasonForTravelCodes: {
            Unknown: "UNKWN",
            Family: "FAMLY",
            Government: "GOVMT",
            Journalistic: "JOURN",
            Professional: "PRORM",
            Educational: "EDUCA",
            Religious: "RELIG",
            Performance: "PERFO",
            SupportCubans: "SUPRT",
            Humanitarian: "HUMAN",
            PrivateOrResearch: "PRIRM",
            Information: "INFOR",
            Export: "EXPRT",
            Licensed: "LICEN"
        },

        /** Types of service-specific traveler data. **/
        TravelerDetailTypes: {
            MaturityType: 1,
            AirlineLoyaltyOperatorId: 2,
            AirlineLoyaltyNumber: 3,
            AirlineMeal: 4,
            AirlineSeating: 5,
            PastPassengerNumber: 6,
            OccupationIdentifier: 7,
            SeniorIdentifier: 8,
            DiningOptionName: 9,
            DiningStatusCode: 10,
            DiningTableSize: 11,
            PromotionCode: 12,
            LocationId: 13,
            DepartureLocationId: 14,
            GdsTravelerReferenceNumber: 15,
            CruiseInsurance: 16,
            FareMaturityType: 17,
            HotelLoyaltyNumber: 18,
            TripValue: 19,
            Address: 20,
            ReasonForTravel: 22
        },

        /** Departure/Arrival times. **/
        AirTimeTypes: {
            AnyTime: 1,
            Morning: 2,
            Midday: 3,
            Afternoon: 4,
            Evening: 5,
            LateOvernight: 6
        },

        /** Air search result sorting. **/
        AirSortTypes: {
            Price: 1,
            AirLine: 2,
            DepartureTime: 3,
            ArrivalTime: 4,
            FromCity: 5,
            Duration: 6,
            Stops: 7,
            Advisory: 8,
            Commission: 9,
            Provider: 10
        },

        /** Air search sort ordering. **/
        AirSortOrderTypes: {
            Ascending: 1,
            Descending: 2
        },

        /** Air search fare option **/
        AirFareTypes: {
            Unrestricted: 1,
            Flexible: 2,
            Any: 3
        },

        AirSpecialServiceRequestStatusTypes: {
            Requested: 1,
            Confirming: 2,
            Confirmed: 3,
            NotAvailable: 4,
            Unavailable: 5,
            Unconfirmed: 6,
            Cancelled: 7
        },

        /** Agent Messages **/

        /* 
        
        Note PNRChangedByAirline: 11 is now PNRChangedByAirline: 12 
        Schedule Change is now 11 according to DB
        
        */

        NotificationsTypes: {
            PaymentDue: 1,
            DepositDue: 2,
            TicketingComplete: 3,
            TicketingError: 4,
            PNRChangedByTicketingDesk: 5,
            PNRCanceled: 6,
            PNRReplaced: 7,
            TicketingLate: 8,
            MessagebyAirline: 9,
            NoResponsetoSpecialService: 10,
            PNRChangedByAirline: 11,
            SpecialInstructions: 12,
            AgentDelegations: 13,
            ScheduleChanges: 14,
            NoLastTicketingDate: 15,
            AgentGeneratedNotification: 16,
            CruiseCancelled: 17,
            ServiceRefunded: 18,
            BookingCancelledByAirline: 19,
            LastTicketingDatePassed: 20,
            ContractNotApplied: 21,
            AutoTicketingFailed: 22,
            CarHotelTourConfirmationNumbers: 23,
            TicoInsuranceWarning: 24,
            TicoVisaWarning: 25,
            MinorScheduleChanges: 26,
            LoyaltyNumbersIgnored: 27
        },

        NotificationPriority: {
            Standard: 1,
            Priority: 2,
            Urgent: 3
        },

        NotificationsUrgency: {
            NotSoUrgent: 1,
            Urgent: 2,
            VeryUrgent: 3
        },

        /** Air City Pair Notice Types **/
        CityPairNoticeTypes: {
            ShortConnection: 1,
            LongConnection: 2,
            OverNightLayOver: 3,
            ChangeTerminal: 4,
            ChangeAirport: 5,
            NonTicketableMarketingCarrier: 6
        },

        /** Applicable to Schedule Changes notification that have been processed **/
        NotificationActionTypes: {
            Accept: 1,
            Reject: 2,
            Replaced: 3
        },

        /** Traveler Documents **/
        TravellerDocumentTypes: {
            Passport: 39,
            Ticket: 2
        },

        CurrencyTypes: {
            USD: 1,
            CAD: 2,
            BMD: 3
        },

        CreditCardTypes: {
            UnKnown: 0,
            VisaInternational: 1,
            MasterCard: 2,
            AmericanExpress: 3,
            DiscoverCard: 4,
            CarteBlanche: 5,
            Delta: 6,
            DinersClub: 7,
            Electron: 8,
            Jcb: 9
        },

        /** Air Cabin type **/
        AirCabinType: {
            Economy: 'M',
            PremiumEconomy: 'W',
            Business: 'C',
            First: 'F'
        },

        /** Used in Back-end **/
        AirCabinTypes: {
            Economy: 1,
            PremiumEconomy: 2,
            Business: 3,
            First: 4
        },

        AirCabinTypeIds: {
            Economy: 1,
            PremiumEconomy: 2,
            Business: 3,
            First: 4
        },

        SpecialInstructionActionType: {
            Add: 1,
            Update: 2,
            Delete: 3
        },

        SeatStatusType: {
            Requested: 1,
            Confirming: 2,
            Confirmed: 3,
            NotAvailable: 4
        },

        SeatCabinLocation: {
            LowerDeck: 1,
            MainDeck: 2,
            UpperDeck: 3
        },


        /** Types of measurements used in baggage allocations; comes with a "Quantity" of one of these. **/
        BaggageQuantityTypes: {
            NumberOfPieces: 1,
            Size: 2,
            Value: 3,
            Weight: 4,
            WeightKilos: 5,
            WeightPounds: 6
        },

        SupportTicketSubCategoryType: {
            SubmittedForTicketing: 1,
            PnrChange: 2,
            PnrCancel: 3,
            GeneralQuestion: 4,
            ExchangeRequest: 5,
            ScheduleChange: 6,
            AirlineMessage: 7,
            SpecialInstructions: 8,
            GeneralInformation: 9,

            UserSignup: 10,
            ScheduleChangeRejected: 11,
            SubmittedForCancel: 12,
            AccountInquiries: 13,
            HelpBooking: 14,
            PromotionalHelp: 15,
            ChangeOrCancelBooking: 16,
            CommissionAndContractHelp: 17
        },

        QueueNumbers: {
            TicketingComplete: 50,
            TicketingError: 51,
            PNRChangedByTicketingDesk: 54,
            PNRCanceled: 59,
            PNRReplaced: 56,
            TicketingLate: 12,
            MessagebyAirline: 9,
            NoResponsetoSpecialService: 23,
            PNRChangedByAirline: 7,
            SpecialInstructions: 1,
            SubmittedForTicketing: 8,
            BackupCommunication: 57
        },

        ExternalServiceTypes: {
            Cruise: 1,
            Air: 2,
            Hotel: 3,
            Car: 4,
            Insurance: 5,
            Tour: 6,
            Misc: 7,
            Transportation: 8,
            Rail: 9
        },

        ExternalBookingMethodTypes: {
            Online: 1,
            Phone: 2,
            Fax: 3,
            Sabre: 4
        },

        ExternalTravelServiceBookingTypes: {
            ClientPaysVendor: 1,
            Reserved: 2,
            RewardsRedemption: 3
        },

        /** Associations to Cruies Ancillary Services. **/
        CruiseAncillaryServiceAssociationTypes: {
            Cabin: 1,
            Passenger: 2
        },

        /** Finance System Sync Status TypeId. **/
        FinanceSystemSyncStatusTypes: {
            NotApplicable: 0,
            NotSynced: 1,
            PendingReSync: 2,
            Synced: 3,
            Error_OnCreate: 4,
            Error_OnUpdate: 5,
            Error_AgentMeddled: 6
        },

        /** Ancillary Services for Cruises. **/
        CruiseAncillaryServiceTypes: {
            /// Insurance options, most providers return this using the AvailableInsuranceOptions field.
            Insurance: 1,

            /// Special Occassions, eg. Birthdays, Aniversaries, etc.
            SpecialOccasion: 2,

            /// Language Preferences.
            LanguagePreference: 3,

            /// Special Requests.
            SpecialRequest: 4,

            /// Prepaid Gratuities.
            Gratutities: 5,

            /// Packages.
            Packages: 6,

            /// Transfers.
            Transfers: 7,

            /// Medical Requests/Notes, e.g. deaf, diabetic, wheelchair req, etc.
            Medical: 8,

            /// Dietary Requests/Notes, e.g. vegetarian, vegan, etc.
            Diet: 9,

            /// Cabin upgrades.
            Upgrades: 10,

            /// Uncategorized.
            Other: 11,

            /// Additional Bed Configuration choices.
            BedConfiguration: 12
        },

        /** Sabre Cryptic Response Codes. **/
        CrypticCommandResponseStatusTypes: {
            Unknown: 0,

            /// Command was sent successful, GDS response is in response element.
            Success: 1,

            /// Command was not sent to GDS, the command was not on the whitelist.
            Blocked: 2,

            /// The session provided is no longer open.
            InvalidSession: 3,

            /// Command was not sent to GDS.
            FailureNotSent: 4,

            /// Command was sent to GDS but an error was received.
            FailureResponse: 5,

            /// There are multiple pricings in RQ.
            FailureDuplicatePricing: 6
        },

        HelpSpotDestinationTypes: {
            HelpSpot: 1
        },
        //Destination type on search page for a hotel
        HotelSearchTypeTypes: {
            Unknown: 0,
            Airport: 1,
            City: 2,
            GeoLocation: 3,
            State: 4,
            Country: 5,
            HotelName: 6
        },

        // Front-end usage of the planning fee widget: determines what template to use
        PlanningFeeUsageTypes: {
            CostSummary: 1,
            PaymentPage: 2
        },

        DistanceMeasureType: {
            Kilometers: 1,
            Miles: 2,
            Blocks: 3,
            Minutes: 4,
            Hours: 5
        },

        TravelServiceCommandTypes: {
            None: 0,
            Remove: 1,
            Cancel: 2,
            Change: 3,
            Book: 6,
            Pay: 7,
            AssignTravelers: 8,
            Refund: 9,
            ChangeAction: 10,
            Requote: 11,
            Update: 12,
            RequestCancel: 13,
            SelectSeats: 14,
            SpecialInstructions: 15,
            SubmittedForTicketing: 16,
            UpdateTravelers: 17,
            CrypticCommand: 18,
            RequestChange: 19,
            RejectCancel: 20
        },

        HotelBookingRequirementTypes: {
            Unknown: 0,
            None: 1,
            Guarantee: 2,
            Deposit: 3,
            PrePay: 4
        },

        InvoiceSourceTypes: {
            Adx: 1,
            Gds: 2,
            ClientBase: 3,
            Other: 4
        },

        FareTypeFilters: {
            ShowAll: 1,
            Commission: 2,
            NetRate: 3,
            PrivateFare: 4
        },

        LocationTypes: {
            Cruse: 1,
            Airport: 2,
            CityCenter: 3
        },

        InsuranceProviderTypes: {
            Travelex: 8,
            Manulife: 14
        },

        InsuranceAddonTypes: {
            CancelForAnyReason: 1,
            CarRentalDamage: 2,
            AdventurePack: 3
        },

        AmenitiesProviderTypes: {
            Virtuoso: 9,
            Cos: 10
        },

        /** Types of HotelTaxeAndSurchargeType **/
        HotelTaxeAndSurchargeType: {
            Tax: 1,
            Surcharge: 2
        },

        /** Hotel rate Rate disclaimer types **/
        HotelRateDisclaimerTypes: {
            TaxIncludedInRoomRate: 1,
            SomeTaxesIncludedInRoomRate: 2,
            Taxes: 3
        },

        GroupTypes: {
            WvtNational: 1,
            VirtuosoBenefit: 2,
            VirtuosoAmenity: 3,
            Deals: 4
        },

        HotelCommissionTypes: {
            Default: 0,
            Percentage: 1,
            Amount: 2
        },

        CorporateProgramTypes: {
            None: 0,
            AA_Business_Extra: 1,
            DL_Sky_Bonus: 2,
            UA_Perks_Plus: 3
        },

        PlanningFeeTypes: {
            AgentServiceFee: 1,
            UpfrontPlanningFee: 2
        },

        MessageTemplateTypes: {
            General: 1,
            ServiceDescription: 2
        }

    };
});
