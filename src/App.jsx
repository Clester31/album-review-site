import { useEffect, useRef, useState } from 'react';
import { getTimestamp } from './getTimestamp';
import StarRating from './components/StarRating';
import noimage from './assets/no-image.jpg';
import './App.css';

export default function App() {

  const APIKEY = '888e6c98bc1116359432358b81a0d15e';
  const ROOT = 'https://ws.audioscrobbler.com/2.0/';

  const [artist, setArtist] = useState("");
  const [albumData, setAlbumData] = useState(null);
  const [addAlbumDisplay, setAddAlbumDisplay] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [otherAlbumData, setOtherAlbumData] = useState(null);
  const [ratingsList, setRatingsList] = useState([]);
  const [currentPage, setCurrentPage] = useState("find_albums");
  const [error, setError] = useState('');
  const [folders, setFolders] = useState([{ name: 'none', albums: [] }]);
  const hasFetched = useRef(false);

  useEffect(() => {
    async function fetchAlbumData(artist) {
      if (artist) {
        const url = `${ROOT}?method=artist.gettopalbums&artist=${artist}&api_key=${APIKEY}&format=json`;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Network response is not OK");
          }
          const data = await response.json();
          console.log(data);
          if (data.topalbums && data.topalbums.album.length > 0) {
            setAlbumData(data);
            setError('');
          } else {
            setAlbumData(null);
            setError('Artist not found');
            console.log(error);
          }
        } catch (error) {
          console.error('ERROR: ', error);
          setAlbumData(null);
          setError('Artist not found');
        }
      }
    }
    if (hasFetched.current) {
      fetchAlbumData(artist);
    } else {
      hasFetched.current = true;
    }
  }, [artist]);

  async function fetchOtherAlbumInfo(artist, album) {
    if (artist && album) {
      const url = `${ROOT}?method=album.getinfo&api_key=${APIKEY}&artist=${artist}&album=${album}&format=json`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response is not OK");
        }
        const data = await response.json();
        console.log(data);
        setOtherAlbumData(data);
      } catch (error) {
        console.error('ERROR: ', error)
      }
    }
  }

  const updateSearchParams = async (e) => {
    e.preventDefault();
    const form = e.target;
    const artist_form = form.artist.value;
    setArtist(artist_form);
    //console.log(artist);
  }

  const setAlbumDisplay = (data) => {
    setSelectedAlbum(data);
    setAddAlbumDisplay(!addAlbumDisplay);
    fetchOtherAlbumInfo(data.artist.name, data.name);
    console.log(otherAlbumData);
  }

  const addAlbumToList = (artist, title, image, tags, rating, review, timestamp, folder) => {
    const newRating = {
      artist: artist,
      title: title,
      image: image,
      tags: tags,
      rating: rating,
      review: review,
      timestamp: timestamp,
    }
    setRatingsList((arr) => [...arr, newRating]);
    setFolders((prev) => {
      return prev.map(f => {
        if (f.name === folder || f.name === 'none') {
          return {
            ...f, albums: [...f.albums, newRating]
          }
        }
        return f;
      })
    })
  }

  const removeAlbum = (albumToRemove) => {
    setRatingsList([...ratingsList.slice(0, albumToRemove), ...ratingsList.slice(albumToRemove + 1)]);
  }

  const createNewFolder = (folderName) => {
    console.log("test");
    const newFolder = {
      name: folderName,
      albums: [],
    }
    setFolders((arr) => [...arr, newFolder]);
  }

  const removeFolder = (folderToRemove) => {
    const albumsToMove = folders.find(folder => folder.name === folderToRemove)?.albums || [];

    setFolders((prevFolders) => {
      return prevFolders.map(folder => {
        if (folder.name === 'none') {
          return {
            ...folder,
            albums: [...folder.albums, ...albumsToMove]
          };
        }
        return folder;
      });
    });

    // Remove the folder
    setFolders((prevFolders) => {
      return prevFolders.filter(folder => folder.name !== folderToRemove);
    });

    // If the current folder is the one being removed, reset to 'none'
    return 'none';
  }

  return (
    <div style={{ paddingTop: '60px' }}>
      <SelectPage currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === 'find_albums' && <SearchAlbum updateSearchParams={updateSearchParams} />}
      {currentPage === 'find_albums' && albumData && <AlbumInfo data={albumData} otherAlbumData={otherAlbumData} display={setAlbumDisplay} />}
      {currentPage === 'find_albums' && !albumData && <MainSplash error={error} artist={artist} />}
      {currentPage === 'find_albums' && addAlbumDisplay && selectedAlbum && <AddAlbum selectedAlbum={selectedAlbum} otherData={otherAlbumData} display={() => setAddAlbumDisplay(false)} addAlbumToList={addAlbumToList} folders={folders} />}

      {currentPage === 'my_list' && <AlbumList ratingsList={ratingsList} removeAlbum={removeAlbum} createNewFolder={createNewFolder} folders={folders} removeFolder={removeFolder} />}
    </div>
  );
}

// Very top two buttons that are used to switch between the 'find albums' page and 'my list' page

function SelectPage({ currentPage, setCurrentPage }) {
  return (
    <div className='flex flex-row justify-center text-white text-lg fixed top-0 left-0 w-screen bg-slate-800'>
      <button style={currentPage === 'find_albums' ? { backgroundColor: '#64748b' } : { backgroundColor: '#334155' }} className='p-2 m-2 w-1/6' onClick={() => setCurrentPage('find_albums')}>Find Albums</button>
      <button style={currentPage === 'my_list' ? { backgroundColor: '#64748b' } : { backgroundColor: '#334155' }} className='p-2 m-2 w-1/6' onClick={() => setCurrentPage('my_list')}>My List</button>
    </div>
  )
}

// From for searching artist

function SearchAlbum({ updateSearchParams }) {
  return (
    <div className='w-screen'>
      <form className='flex flex-row text-white justify-center' onSubmit={updateSearchParams}>
        <div className="artist-input-div">
          <label className='text-lg' htmlFor="artist">Artist</label>
          <input type="text" id='artist' name='artist' required className='px-2 bg-slate-700 mx-2 w-96 h-10 text-lg' />
        </div>
        <button type="submit" className='w-1/6 bg-slate-700 text-white hover:bg-slate-500 text-lg'>Search Album</button>
      </form>
    </div>
  );
}

function MainSplash({ error }) {
  return (
    <div className='flex flex-col justify-center items-center h-96 text-white leading-8 w-2/5 text-center m-auto'>
      {error !== 'Artist not found' ?
        <div>
          <h1 className='text-3xl mb-3'>Welcome to my album reviewing site!</h1>
          <p className='text-lg mb-3 text-slate-300'>Get an artist's discography in the search bar above. Selecting an item will allow you to give it a rating and short review.</p>
          <p className='text-lg text-slate-300'>Any rated albums will appear in the 'My List' section. You can also search for any albums you rated with specific tags</p>
        </div> :
        <div>
          <h1 className='text-3xl'>Artist not found</h1>
        </div>
      }
    </div>
  )
}

// The entire list of albums that is shown after searching for an artist

function AlbumInfo({ data, display }) {
  return (
    <div className='flex flex-row flex-wrap m-2'>
      {data.topalbums.album.map((item, idx) => {
        //console.log(item);
        return item.name !== '(null)' && <AlbumSingle key={idx} data={item} display={display} />
      })}
    </div>
  );
}

// Each individual search result that appears after searching an artist

function AlbumSingle({ data, display }) {
  return (
    <div className='album-single p-2 w-32 hover:bg-slate-700 cursor-pointer text-white border-2 border-slate-500' onClick={() => display(data)}>
      <img src={data.image[2]['#text'] !== '' ? data.image[2]['#text'] : noimage} alt="" className='w-32' />
      <h1>{data.name.length > 25 ? `${data.name.slice(0, 24)}...` : data.name}</h1>
    </div>
  );
}

// Display that appears after selecting an album
// This is where users can see the tracklist, rate, and write a review for the specific album
// Submitting this form will add the album info to 'my list'

function AddAlbum({ selectedAlbum, otherData, display, addAlbumToList, folders }) {
  const [showTracklist, setShowTracklist] = useState(false);
  const [albumRating, setAlbumRating] = useState(0);
  const [review, setReview] = useState('');
  const [folder, setFolder] = useState('none')

  useEffect(() => {
    console.log('rating updated to: ', albumRating);
  }, [albumRating]);

  useEffect(() => {
    console.log('album to be added to:', folder)
  }, [folder]);

  const updateRating = (rating) => {
    setAlbumRating(rating);
  }

  const handleSubmit = () => {
    // const now = new Date();
    // const year = now.getFullYear();
    // const month = now.getMonth() + 1;
    // const day = now.getDate();
    // const hour = now.getHours();
    // const minute = now.getMinutes();
    // const second = now.getSeconds();
    // const timestamp = `${day}-${month}-${year} ${hour}:${minute < 10 ? `0${minute}` : minute}:${second < 10 ? `0${second}` : second}`;
    const timestamp = getTimestamp();
    addAlbumToList(selectedAlbum.artist.name, selectedAlbum.name, selectedAlbum.image[2]['#text'], otherData.album.tags.tag, albumRating, review, timestamp, folder);
    display();
  }

  const updateReview = (e) => {
    setReview(e);
    console.log(review);
  }

  if (!selectedAlbum) return null;
  if (!otherData) return null;

  return (
    <div className='display text-white w-screen h-screen flex flex-col items-center justify-center m-auto fixed top-0 left-0 overflow-x-auto overflow-y-auto'>
      <button onClick={display} className='text-white bg-red-700 rounded-full text-2xl hover:bg-red-500 cursor-pointer w-10 h-10 flex items-center justify-center absolute top-2 right-2 z-50 m-2'><i className="fa-solid fa-xmark"></i></button>
      {!showTracklist && <img src={selectedAlbum.image[2]['#text'] !== '' ? selectedAlbum.image[2]['#text'] : noimage} alt="" className='w-40' />}
      <h1 className='font-bold text-2xl my-2'>{selectedAlbum.name} - {selectedAlbum.artist.name}</h1>
      {!showTracklist && otherData.album.tracks && <p className='flex flex-row mb-2'>{otherData.album.tags.tag.map((item, idx) => (
        <span key={idx} className='bg-slate-700 px-2 py-1 m-2 rounded'>{item.name}</span>
      ))}</p>}
      {otherData.album.tracks && <h1 onClick={() => setShowTracklist(!showTracklist)} className='cursor-pointer bg-slate-700 p-1 w-1/3 text-center rounded'>Tracklist <i className="fa-solid fa-caret-down"></i></h1>}
      <ol className='w-1/3 my-2'>
        {showTracklist === false ? '' : otherData.album.tracks.track.map((item, idx) => {
          return (
            <div key={idx} className='flex justify-between items-center bg-slate-800 px-2 py-1 m-1'>
              <li className='flex-1'>
                <span className='px-1 py-1 rounded'>{item.name}</span>
              </li>
              <span className='px-1 rounded'>
                {Math.floor(item.duration / 60)}:{item.duration % 60 < 10 ? `0${item.duration % 60}` : item.duration % 60}
              </span>
            </div>
          );
        })}
      </ol>
      {!showTracklist &&
        <div className='flex flex-col items-center'>
          <StarRating maxRating={10} onSetRating={updateRating} />
          <label className='my-2' htmlFor="review-text">Write a review (500 characters max)</label>
          <textarea className='bg-slate-800 p-2 resize-none outline-none text-sm border-2 border-slate-500' name='review-text' rows={8} cols={85} maxLength={500} onChange={(e) => updateReview(e.target.value)}></textarea>
          <div className='flex flex-row items-center'>
            <button onClick={handleSubmit} className='text-white bg-slate-700 my-3 py-2 px-10 rounded text-2xl hover:bg-slate-500 cursor-pointer my-1 mx-2'>Add Album</button>
            <label htmlFor="addToFolder" className='text-xl mx-2'>Add to Folder: </label>
            <select name="addToFolder" id="addToFolder" className='mx-2 text-white bg-slate-700 outline-none p-2 text-xl' onChange={(e) => setFolder(e.target.value)}>
              {folders.map((folder, idx) => {
                return <option key={idx}>{folder.name}</option>
              })}
            </select>
          </div>
        </div>
      }
    </div>
  );
}

// The 'my list' section where users can see all the albums they have rated/reviewed/added to the list

function AlbumList({ ratingsList, removeAlbum, createNewFolder, folders, removeFolder }) {
  const [filter, setFilter] = useState('');
  const [currentFolder, setCurrentFolder] = useState('none');
  const [ratingFilter, setRatingFilter] = useState('All');

  useEffect(() => {
    console.log('current folder set to:', currentFolder);
    console.log(folders);
  }, [currentFolder, folders]);

  const updateListFilters = (filter) => {
    setFilter(filter);
  };

  const updateRatingFilters = (rating) => {
    setRatingFilter(rating);
  }

  const getFilteredAlbums = () => {
    let albums = ratingsList;

    if (currentFolder !== 'none') {
      const folder = folders.find(f => f.name === currentFolder);
      if (folder) {
        albums = folder.albums;
      } else {
        albums = [];
      }
    }

    if (filter) {
      albums = albums.filter(album => album.tags.some(tag => tag.name === filter));
    }

    if (ratingFilter !== 'All') {
      albums = albums.filter(album => album.rating === parseInt(ratingFilter));
    }

    return albums;
  };

  const filteredList = getFilteredAlbums();

  return (
    <div>
      <ListFolders createNewFolder={createNewFolder} folders={folders} setCurrentFolder={setCurrentFolder} currentFolder={currentFolder} removeFolder={removeFolder} />
      <ListOptions updateListFilters={updateListFilters} updateRatingFilters={updateRatingFilters} />
      <h1 className='text-white flex justify-center text-2xl'>{filteredList.length > 0 ? 'My List' : ''}</h1>
      {filteredList.length > 0 ? <div className='w-4/5 flex flex-col justify-center m-auto'>
        {filteredList.map((item, idx) => {
          return <ListItem key={idx} index={idx} album={item} removeAlbum={removeAlbum} />
        })}
      </div> :
        <div className='flex justify-center items-center h-96 text-white text-3xl'>
          <h1>{filter.length === 0 ? 'Your list is empty. Add something to it!' : 'No albums found with tag'}</h1>
        </div>
      }
    </div>
  );
}

// each individual item in the list

function ListItem({ index, album, removeAlbum }) {
  const [reviewDisplay, setReviewDisplay] = useState(false);
  const [editDisplay, setEditDisplay] = useState(false);
  const [reivewWasEdited, setReviewWasEdited] = useState(false);
  const [rating, setRating] = useState(album.rating);
  const [review, setReview] = useState(album.review);
  const [timestamp, setTimestamp] = useState(album.timestamp); 

  const showReview = () => {
    if (album.review.length > 0) {
      setReviewDisplay(!reviewDisplay);
    }
  }

  const editReview = () => {
    setEditDisplay(!editDisplay);
  }

  const updateListItem = (newRating, newReview) => {
    setRating(newRating);
    setReview(newReview);
    setTimestamp(`edited: ${getTimestamp()}`);
    if(!reivewWasEdited) {
      setReviewWasEdited(true);
    }
  }

  useEffect(() => {
    console.log('review has been updated');
  }, [rating, review]);
  
  return (
    <div>
      {editDisplay && <EditReview editDisplay={editDisplay} setEditDisplay={setEditDisplay} album={album} updateListItem={updateListItem} />}
      <div className='py-2 px-5 m-1 bg-slate-700 rounded flex flex-row text-white justify-between text-2xl'>
        <div className='flex flex-row'>
          <button><i className={review.length > 0 ? "fa-solid fa-caret-down pr-5 hover:text-amber-500" : "fa-solid fa-caret-down pr-5 text-slate-500"} onClick={showReview}></i></button>
          <img src={album.image} className='w-20' alt={`${album.title} cover`} />
          <div className='flex flex-col ml-2 justify-between'>
            <h1 className='text-2xl'>{album.artist} - {album.title}</h1>
            <div className='flex flex-wrap'>
              {album.tags && album.tags.map((tag, idx) => (
                <span key={idx} className='bg-slate-500 text-sm rounded p-1 m-1'>{tag.name}</span>
              ))}
            </div>
          </div>
        </div>
        <div className='flex flex-row'>
          {/* <div className='flex items-center'>
            <button className='bg-slate-600 p-3 rounded hover:bg-slate-500' onClick={editReview}>Edit Rating/Review</button>
          </div> */}
          <div className='flex my-auto p-2 justify-center m-3 items-center bg-slate-600 rounded h-14'>
            <p className='text-amber-400 text-2xl p-3'><i className="fa-solid fa-star text-amber-400"></i> {rating}/10</p>
            <button className='bg-red-700 p-4 rounded hover:bg-red-500 h-8 text-xl flex items-center' onClick={() => removeAlbum(index)}><i className="fa-solid fa-trash text-xl mr-2"></i> Remove</button>
          </div>
        </div>
      </div>
      <div className='review-dropdown'>
        {reviewDisplay &&
          <div className='bg-slate-600 py-2 px-5 text-white m-1 rounded'>
            <p className='text-lg'>{review}</p>
            <p className='text-slate-300 text-sm'>{timestamp}</p>
          </div>
        }
      </div>
    </div>
  )
}

// options for searching albums in the list by their tags

function ListOptions({ updateListFilters, updateRatingFilters }) {
  const [filter, setFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    updateListFilters(e.target.value);
  };

  const handleRatingFilterChange = (e) => {
    setRatingFilter(e.target.value);
    updateRatingFilters(e.target.value);
  };

  return (
    <div className='text-white flex justify-center m-2'>
      <form>
        <label htmlFor="searchByFilter" className='mx-2 text-xl'>Search Tags</label>
        <input className='mx-2 bg-slate-700 border-none h-8' type="text" name='searchByFilter' onChange={handleFilterChange} />
        <label htmlFor="searchByRating" className='mx-2 text-xl'>Search Rating</label>
        <select name="searchByRating" id="searchByRating" className='text-white bg-slate-700 outline-none p-1' onChange={handleRatingFilterChange}>
          <option>All</option>
          {[...Array(11).keys()].map(rating => (
            <option key={rating} value={rating}>{rating}</option>
          ))}
        </select>
      </form>
    </div>
  );
}


function ListFolders({ createNewFolder, folders, setCurrentFolder, currentFolder, removeFolder }) {
  const [newFolderDisplay, setNewFolderDisplay] = useState(false);

  const handleSubmit = () => {
    setNewFolderDisplay(!newFolderDisplay);
  };

  const handleFolderChange = (e) => {
    setCurrentFolder(e.target.value);
  };

  const handleRemoveFolder = () => {
    const newCurrentFolder = removeFolder(currentFolder);
    setCurrentFolder(newCurrentFolder);
  };

  return (
    <div>
      {newFolderDisplay && <NewFolderDisplay display={newFolderDisplay} hideDisplay={setNewFolderDisplay} createNewFolder={createNewFolder} />}
      <div className='flex flex-row justify-center m-2'>
        <button className='bg-slate-700 text-white p-2 rounded hover:bg-slate-500 mx-2' onClick={handleSubmit}><i className="fa-solid fa-plus"></i> New Folder</button>
        <div className='text-white bg-slate-700 mx-2 p-2 flex justify-center items-center text-center'>
          <i className="fa-solid fa-folder mx-1"></i>
          <select className='text-white bg-slate-700 outline-none' name='selectFolders' id='selectFolders' onChange={handleFolderChange} value={currentFolder}>
            {folders.map((folder, idx) => (
              <option key={idx} value={folder.name}>{folder.name}</option>
            ))}
          </select>
        </div>
        {currentFolder !== 'none' &&
          <div className='bg-red-500 text-white rounded flex items-center text-center justify-center'>
            <button className='flex items-center justify-center p-2' onClick={handleRemoveFolder}>
              <i className="fa-solid fa-trash text-xl"></i>
            </button>
          </div>
        }
      </div>
    </div>
  );
}

function NewFolderDisplay({ display, hideDisplay, createNewFolder }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = () => {
    hideDisplay();
    createNewFolder(folderName);
  }

  return (
    <div className='folder-display text-white w-screen h-screen flex flex-col items-center justify-center m-auto fixed top-0 left-0 overflow-scroll overflow-x-auto overflow-y-auto'>
      <div className='bg-slate-800 p-5 flex flex-col text-center items-center'>
        <label className='text-xl' htmlFor="folderName">Folder Name</label>
        <input className='my-2 text-white bg-slate-600 p-2' type="text" name='folderName' onChange={(e) => setFolderName(e.target.value)} />
        <div className='mt-2'>
          <button className='mx-2 bg-slate-700 text-white p-2 rounded hover:bg-slate-500' onClick={() => handleSubmit(!display)}>Add</button>
          <button className='mx-2 bg-slate-700 text-white p-2 rounded hover:bg-slate-500' onClick={() => hideDisplay(!display)}>Close</button>
        </div>
      </div>
    </div>
  )
}