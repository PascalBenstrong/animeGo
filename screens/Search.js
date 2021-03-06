import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, AsyncStorage, Picker, Dimensions } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { TouchableHighlight } from 'react-native-gesture-handler';

class Search extends Component {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: params ? params.title : 'Search',
      headerTintColor: '#ffffff',
      headerStyle: {
        backgroundColor: '#228922'
      }
    };
  };

  constructor(props) {
    super(props)

    global.site = ''
    this.state = {
      list: null,
      isLoading: true,
      error: false,
      errorSearch: false,
      querySearch: '',
      genre: 'Search',
      genreList: null,
      page: 1
    }
  }

  render() {
    let self = this
    const { width } = Dimensions.get('window').width
    if (!this.state.isLoading && !this.state.error) {
      if (this.state.genreList === null) this.setState({ error: true })
      let genres = this.state.genreList.map(function (field) {
        return (
          <Picker.Item label={field} value={field} key={field} />
        );
      })
      let flatlist, forward, backward
      if (this.state.list !== null) {
        flatlist = this.state.list.map(function (item) {
          return (
            <View key={item.slug} style={{width: '90%'}}>
              <TouchableHighlight key={item.slug} onPress={() => {alert('anime')}} style={buttons2.button2} underlayColor="white">
              <View>
                <Text style={buttons.text}>{item.title}</Text>
              </View>
            </TouchableHighlight>
            </View>
          );
        })
        forward = <TouchableHighlight key={'forward'} onPress={() => { self.searchAnime(false, 'Next') }} style={buttons2.button} underlayColor="white">
              <View>
                <Text style={buttons.text}>{'Next'}</Text>
              </View>
            </TouchableHighlight>
        backward = <TouchableHighlight key={'backward'} onPress={() => { self.searchAnime(false, 'Back') }} style={buttons2.button} underlayColor="white">
              <View>
                <Text style={buttons.text}>{'Back'}</Text>
              </View>
            </TouchableHighlight>
      }
      return (
        <View style={{alignItems: 'center'}}>
          <View key={'search'} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <View key={'first'} style={{ width: '90%', flexDirection: 'row', marginBottom: 5 }}>
              <Searchbar
                placeholder='Search'
                onChangeText={query => this.setState({ querySearch: query, page: 1 })}
                value={self.state.querySearch}
                style={{ width: '75%' }}
              />
              <Picker
                selectedValue={self.state.genre}
                style={{ height: 50, width: '39%' }}
                onValueChange={currentValue => this.setState({ genre: currentValue, page: 1 })}
              >
                <Picker.Item label='Search' value='Search' />
                {genres}
              </Picker>
            </View>
          </View>
          <View style={{flexDirection:'row', flexWrap:'wrap'}}>
            {backward}
            <TouchableHighlight key={'search'} onPress={() => { self.searchAnime(false) }} style={buttons2.button} underlayColor="white">
              <View>
                <Text style={buttons.text}>{'Search'}</Text>
              </View>
            </TouchableHighlight>
            {forward}
          </View>
          <View key={'animeList'} style={{ width: width, height: '82%'}}>
            <ScrollView ScrollView contentContainerStyle={optionStyles.options}>
              {flatlist}
            </ScrollView>
          </View>
        </View>
      );
    } else if (this.state.isLoading) {
      return (
        <View style={loadingStyles.container}>
          <ActivityIndicator size={60} color='#228922' />
          <Text style={loadingStyles.text}>Loading list...</Text>
        </View>
      );
    } else if (this.state.error) {
      return (
        <View style={loadingStyles.container}>
          <Text style={loadingStyles.text}>The server throws an unexpected error.</Text>
          <TouchableHighlight key={'error'} onPress={() => { self.fetchingDataGenre(true) }} style={buttons.button} underlayColor="white">
            <View>
              <Text style={buttons.text}>{'Refresh'}</Text>
            </View>
          </TouchableHighlight>
        </View>
      );
    }
  }

  async searchAnime(isError, pagination) {
    let self = this
    let page = this.state.page
    if (pagination === 'Next') page+=1
    else if (pagination === 'Back' && page > 1) page-=1 
    if (isError) {
      this.setState({
        isLoading: true,
        errorSearch: false,
        error: false,
      })
    } else {
      this.setState({
        isLoading: true,
        page: page
      })
    }
    try {
      let list
      if (self.state.genre !== 'Search') list = await getAnimeGenres(self.state.genre, page)
      else list = await getAnimeSearch(self.state.querySearch, page)
      if (list.hasOwnProperty('message')) {
        this.setState({
          errorSearch: true,
          isLoading: false,
          error: false,
          page: page
        })
        alert('There was an error on search.')
      } else {
        this.setState({
          list: list,
          isLoading: false,
          errorSearch: false,
          error: false,
          page: page
        })
      }
    } catch (error) {
      console.log(error)
      this.setState({
        list: null,
        isLoading: false,
        errorSearch: true,
        error: false,
        page: page
      })
      alert('There was an error on search.')
    }
  }

  async fetchingDataGenre(isError) {
    if (isError) {
      this.setState({
        isLoading: true,
        error: false,
        errorSearch: false,
        page: 1
      })
    }
    try {
      let list = await getGenres()
      if (list.hasOwnProperty('message')) {
        this.setState({
          error: true,
          isLoading: false,
          errorSearch: false,
          page: 1
        })
      } else {
        this.setState({
          genreList: list,
          isLoading: false,
          error: false,
          errorSearch: false,
          page: 1
        })
      }
    } catch (error) {
      this.setState({
        genreList: null,
        isLoading: false,
        error: true,
        errorSearch: false,
        page: 1
      })
    }
  }

  async componentDidMount() {
    const site = await AsyncStorage.getItem('site')
    this.props.navigation.setParams({ title: site })
    if (site) {
      global.site = site
      await this.fetchingDataGenre(false)
    }

  }
}

async function getGenres() {
  const endpoint = `http://144.91.74.212/api/${global.site}/genre/list`
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  })
  const json = await response.json()
  return json
}

async function getAnimeGenres(genre, page) {
  const endpoint = `http://144.91.74.212/api/${global.site}/genre`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'type': genre,
      'page': page
    })
  })
  const json = await response.json()
  return json
}

async function getAnimeSearch(querySearch, page) {
  const endpoint = `http://144.91.74.212/api/${global.site}/search`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'value': querySearch,
      'page': page
    })
  })

  const json = await response.json()
  return json
}

const optionStyles = StyleSheet.create({
  options: {
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    marginBottom: 10
  },
  container: {
    marginTop: 20
  }
})

const loadingStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.8,
    flexDirection: 'column'
  },
  text: {
    fontSize: 20,
    marginBottom: 10
  }
})

const buttons = StyleSheet.create({
  button: {
    marginBottom: 10,
    width: 150,
    marginLeft: '10%',
    height: 33,
    alignItems: 'center',
    backgroundColor: '#C6C6C6',
    borderRadius: 5
  },
  text: {
    borderRadius: 20,
    textAlign: 'center',
    marginTop: 5,
    color: '#ffffff'
  }
})

const buttons2 = StyleSheet.create({
  button: {
    marginBottom: 5,
    height: 33,
    width: 55,
    marginLeft: 10,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#C6C6C6',
    borderRadius: 5
  },
  button2: {
    marginBottom: 5,
    height: 33,
    alignItems: 'center',
    backgroundColor: '#C6C6C6',
    borderRadius: 5
  },
  text: {
    borderRadius: 20,
    textAlign: 'center',
    marginTop: 5,
    color: '#ffffff'
  }
})

export default Search;