var TemplateLibraryTemplateLocalView = require( 'elementor-templates/views/template/local' ),
	TemplateLibraryTemplateRemoteView = require( 'elementor-templates/views/template/remote' ),
	Masonry = require( 'elementor-utils/masonry' ),
	TemplateLibraryCollectionView;

TemplateLibraryCollectionView = Marionette.CompositeView.extend( {
	template: '#tmpl-elementor-template-library-templates',

	id: 'elementor-template-library-templates',

	childViewContainer: '#elementor-template-library-templates-container',

	reorderOnSort: true,

	emptyView: function() {
		var EmptyView = require( 'elementor-templates/views/parts/templates-empty' );

		return new EmptyView();
	},

	ui: {
		textFilter: '#elementor-template-library-filter-text',
		selectFilter: '.elementor-template-library-filter-select',
		myFavoritesFilter: '#elementor-template-library-filter-my-favorites',
		orderInputs: '.elementor-template-library-order-input',
		orderLabels: 'label.elementor-template-library-order-label',
	},

	events: {
		'input @ui.textFilter': 'onTextFilterInput',
		'change @ui.selectFilter': 'onSelectFilterChange',
		'change @ui.myFavoritesFilter': 'onMyFavoritesFilterChange',
		'mousedown @ui.orderLabels': 'onOrderLabelsClick',
	},

	comparators: {
		title: function( model ) {
			return model.get( 'title' ).toLowerCase();
		},
		popularityIndex: function( model ) {
			var popularityIndex = model.get( 'popularityIndex' );

			if ( ! popularityIndex ) {
				popularityIndex = model.get( 'date' );
			}

			return -popularityIndex;
		},
		trendIndex: function( model ) {
			var trendIndex = model.get( 'trendIndex' );

			if ( ! trendIndex ) {
				trendIndex = model.get( 'date' );
			}

			return -trendIndex;
		},
	},

	getChildView: function( childModel ) {
		if ( 'remote' === childModel.get( 'source' ) ) {
			return TemplateLibraryTemplateRemoteView;
		}

		return TemplateLibraryTemplateLocalView;
	},

	initialize: function() {
		this.listenTo( elementor.channels.templates, 'filter:change', this._renderChildren );
	},

	filter: function( childModel ) {
		var filterTerms = elementor.templates.getFilterTerms(),
			passingFilter = true;

		jQuery.each( filterTerms, function( filterTermName ) {
			var filterValue = elementor.templates.getFilter( filterTermName );

			if ( ! filterValue ) {
				return;
			}

			if ( this.callback ) {
				var callbackResult = this.callback.call( childModel, filterValue );

				if ( ! callbackResult ) {
					passingFilter = false;
				}

				return callbackResult;
			}

			var filterResult = filterValue === childModel.get( filterTermName );

			if ( ! filterResult ) {
				passingFilter = false;
			}

			return filterResult;
		} );

		return passingFilter;
	},

	order: function( by, reverseOrder ) {
		var comparator = this.comparators[ by ] || by;

		if ( reverseOrder ) {
			comparator = this.reverseOrder( comparator );
		}

		this.collection.comparator = comparator;

		this.collection.sort();
	},

	reverseOrder: function( comparator ) {
		if ( 'function' !== typeof comparator ) {
			var comparatorValue = comparator;

			comparator = function( model ) {
				return model.get( comparatorValue );
			};
		}

		return function( left, right ) {
			var l = comparator( left ),
				r = comparator( right );

			if ( undefined === l ) {
				return -1;
			}

			if ( undefined === r ) {
				return 1;
			}

			if ( l < r ) {
				return 1;
			}
			if ( l > r ) {
				return -1;
			}
			return 0;
		};
	},

	addSourceData: function() {
		var isEmpty = this.children.isEmpty();

		this.$el.attr( 'data-template-source', isEmpty ? 'empty' : elementor.templates.getFilter( 'source' ) );
	},

	setFiltersUI: function() {
		var $filters = this.$( this.ui.selectFilter );

		$filters.select2( {
			placeholder: elementor.translate( 'category' ),
			allowClear: true,
			width: 150,
		} );
	},

	setMasonrySkin: function() {
		var masonry = new Masonry( {
			container: this.$childViewContainer,
			items: this.$childViewContainer.children(),
		} );

		this.$childViewContainer.imagesLoaded( masonry.run.bind( masonry ) );
	},

	toggleFilterClass: function() {
		this.$el.toggleClass( 'elementor-templates-filter-active', !! ( elementor.templates.getFilter( 'text' ) || elementor.templates.getFilter( 'favorite' ) ) );
	},

	onRenderCollection: function() {
		this.addSourceData();

		this.toggleFilterClass();

		if ( 'remote' === elementor.templates.getFilter( 'source' ) && 'block' === elementor.templates.getFilter( 'type' ) ) {
			this.setFiltersUI();

			this.setMasonrySkin();
		}
	},

	onBeforeRenderEmpty: function() {
		this.addSourceData();
	},

	onTextFilterInput: function() {
		elementor.templates.setFilter( 'text', this.ui.textFilter.val() );
	},

	onSelectFilterChange: function( event ) {
		var $select = jQuery( event.currentTarget ),
			filterName = $select.data( 'elementor-filter' );

		elementor.templates.setFilter( filterName, $select.val() );
	},

	onMyFavoritesFilterChange: function() {
		elementor.templates.setFilter( 'favorite', this.ui.myFavoritesFilter[ 0 ].checked );
	},

	onOrderLabelsClick: function( event ) {
		var $clickedInput = jQuery( event.currentTarget.control ),
			toggle;

		if ( ! $clickedInput[ 0 ].checked ) {
			toggle = 'asc' !== $clickedInput.data( 'default-ordering-direction' );
		}

		$clickedInput.toggleClass( 'elementor-template-library-order-reverse', toggle );

		this.order( $clickedInput.val(), $clickedInput.hasClass( 'elementor-template-library-order-reverse' ) );
	},
} );

module.exports = TemplateLibraryCollectionView;
